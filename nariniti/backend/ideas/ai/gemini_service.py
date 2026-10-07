import os
import json
import logging

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are NariNiti's AI business advisor helping Indian women entrepreneurs.

The user has described their business idea. Extract structured information from it.

USER INPUT:
{user_input}

Return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
{{
  "language": "English or Hindi or Marathi",
  "business_type": "normalized business type in English",
  "sector": "one of: food_processing | textiles_apparel | beauty_wellness | agriculture | dairy | handicrafts | retail | education | technology | manufacturing | services | healthcare | other",
  "location": "city/state mentioned or Not specified",
  "capital": null or integer INR amount,
  "target_customers": ["array of strings"],
  "skills": ["array of strings"],
  "experience": "Not specified or description",
  "business_stage": "idea or startup or growth or established",
  "goal": "summarized goal in English",
  "keywords": ["relevant English keywords for matching"],
  "required_support": ["what support the user needs"],
  "is_vague": false,
  "follow_up_questions": []
}}

SECTOR MAPPING:
- Cooking/food/masala/tiffin/pickle/snacks/millet/ragi → food_processing
- Tailoring/stitching/clothing/fashion/kapda → textiles_apparel
- Beauty/salon/makeup/mehendi → beauty_wellness
- Farming/vegetables/flowers/sheti → agriculture
- Dairy/milk/ghee/dudh → dairy
- Handicrafts/pottery/weaving/embroidery/hastakala → handicrafts
- Shop/store/retail → retail
- Tuition/coaching/training/shikshan → education
- Software/IT/digital/tech → technology

CAPITAL PARSING:
- "50 हजार" or "50 thousand" or "50k" → 50000
- "2 lakh" or "2 lac" or "2 लाख" → 200000
- "5 लाख" → 500000

If is_vague is true (idea too unclear), add 2-3 follow_up_questions in English.
Do NOT invent information. Use "Not specified" for unknown text fields and null for unknown numbers."""


def extract_business_profile(user_input: str) -> dict:
    """
    Use Gemini to extract structured business profile from user text.
    Falls back to smart keyword extraction if API key is not set.
    """
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — using smart fallback extraction')
        return _fallback_extraction(user_input)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = EXTRACTION_PROMPT.format(user_input=user_input)

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=1024,
            )
        )

        raw_text = response.text.strip()
        # Strip markdown code fences if present
        if '```' in raw_text:
            parts = raw_text.split('```')
            for part in parts:
                part = part.strip()
                if part.startswith('json'):
                    part = part[4:].strip()
                if part.startswith('{'):
                    raw_text = part
                    break

        result = json.loads(raw_text)
        result['raw_response'] = raw_text
        return _validate_and_normalise(result)

    except json.JSONDecodeError as e:
        logger.error(f'Gemini returned invalid JSON: {e}')
        return _retry_extraction(user_input, api_key)
    except Exception as e:
        logger.error(f'Gemini extraction error: {e}')
        return _fallback_extraction(user_input)


def transcribe_audio_with_gemini(audio_bytes: bytes, mime_type: str = 'audio/webm') -> dict:
    """
    Use Gemini multimodal to transcribe audio and extract business profile.
    Returns dict with transcription + business profile.
    """
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return {'transcription': '', 'error': 'GEMINI_API_KEY not configured', 'profile': _fallback_extraction('')}

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = """Listen to this audio recording of an Indian woman describing her business idea.
Step 1: Transcribe exactly what she says (preserve original language - Hindi/Marathi/English).
Step 2: Extract business information.

Return ONLY this JSON (no markdown):
{
  "transcription": "exact words spoken",
  "language": "English|Hindi|Marathi",
  "business_type": "in English",
  "sector": "food_processing|textiles_apparel|beauty_wellness|agriculture|dairy|handicrafts|retail|education|technology|manufacturing|services|healthcare|other",
  "location": "mentioned location or Not specified",
  "capital": null or integer,
  "target_customers": [],
  "skills": [],
  "experience": "Not specified",
  "business_stage": "idea|startup|growth|established",
  "goal": "in English",
  "keywords": [],
  "required_support": [],
  "is_vague": false,
  "follow_up_questions": []
}"""

        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[prompt, audio_part],
        )

        raw_text = response.text.strip()
        if '```' in raw_text:
            parts = raw_text.split('```')
            for part in parts:
                part = part.strip().lstrip('json').strip()
                if part.startswith('{'):
                    raw_text = part
                    break

        result = json.loads(raw_text)
        transcription = result.pop('transcription', '')
        return {
            'transcription': transcription,
            'profile': _validate_and_normalise(result),
        }

    except Exception as e:
        logger.error(f'Gemini audio error: {e}')
        return {'transcription': '', 'error': str(e), 'profile': _fallback_extraction('')}


def _retry_extraction(user_input: str, api_key: str) -> dict:
    """Second attempt with stricter JSON-only instruction."""
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = (
            f'Return ONLY valid JSON. Input: "{user_input[:300]}"\n'
            'JSON template: {"language":"English","business_type":"","sector":"other",'
            '"location":"Not specified","capital":null,"target_customers":[],"skills":[],'
            '"experience":"Not specified","business_stage":"idea","goal":"","keywords":[],'
            '"required_support":[],"is_vague":false,"follow_up_questions":[]}\n'
            'Fill values from the input. Return only valid JSON.'
        )
        response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        raw = response.text.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        result = json.loads(raw)
        return _validate_and_normalise(result)
    except Exception:
        return _fallback_extraction(user_input)


def _validate_and_normalise(data: dict) -> dict:
    """Ensure all required fields exist with correct types."""
    valid_sectors = [
        'food_processing', 'textiles_apparel', 'beauty_wellness', 'agriculture',
        'dairy', 'handicrafts', 'retail', 'education', 'technology',
        'manufacturing', 'services', 'healthcare', 'other'
    ]
    valid_stages = ['idea', 'startup', 'growth', 'established']

    capital = data.get('capital')
    if isinstance(capital, str):
        capital = ''.join(filter(str.isdigit, capital)) or None
        capital = int(capital) if capital else None
    elif isinstance(capital, float):
        capital = int(capital)

    return {
        'language': str(data.get('language', 'English') or 'English'),
        'business_type': str(data.get('business_type', '') or ''),
        'sector': data.get('sector', 'other') if data.get('sector') in valid_sectors else 'other',
        'location': str(data.get('location', 'Not specified') or 'Not specified'),
        'capital': capital,
        'target_customers': list(data.get('target_customers') or []),
        'skills': list(data.get('skills') or []),
        'experience': str(data.get('experience', 'Not specified') or 'Not specified'),
        'business_stage': data.get('business_stage', 'idea') if data.get('business_stage') in valid_stages else 'idea',
        'goal': str(data.get('goal', '') or ''),
        'keywords': list(data.get('keywords') or []),
        'required_support': list(data.get('required_support') or []),
        'is_vague': bool(data.get('is_vague', False)),
        'follow_up_questions': list(data.get('follow_up_questions') or []),
        'raw_response': data.get('raw_response', ''),
    }


def _fallback_extraction(user_input: str) -> dict:
    """
    Smart keyword-based fallback when Gemini API key is not set.
    Extracts sector, language, location, capital, target customers
    and skills from English / Hindi / Marathi / Hinglish text.
    """
    import re
    text = user_input.lower()

    # ── Sector + business type detection ──────────────────────────
    sector_map = [
        ('food_processing', ['masala', 'food', 'cook', 'tiffin', 'pickle', 'snack', 'millet',
                             'ragi', 'laddoo', 'ladoo', 'cookie', 'bakery', 'khana', 'healthy snack',
                             'मसाल', 'खाना', 'जेवण', 'मसाले', 'खाद्य', 'बिस्किट', 'नाश्ता']),
        ('textiles_apparel', ['tailoring', 'stitch', 'cloth', 'fashion', 'boutique', 'dress',
                              'kapda', 'stitching', 'सिलाई', 'कपडे', 'शिवणकाम', 'बुटीक']),
        ('beauty_wellness', ['beauty', 'salon', 'makeup', 'mehendi', 'mehndi', 'parlour', 'parlor',
                             'ब्यूटी', 'सलून', 'मेहंदी']),
        ('agriculture',    ['farm', 'vegetable', 'flower', 'organic', 'crop', 'harvest',
                            'शेती', 'खेती', 'सब्जी', 'फूल', 'बागवानी']),
        ('dairy',          ['dairy', 'milk', 'ghee', 'paneer', 'curd', 'yogurt',
                            'दूध', 'डेयरी', 'तूप', 'पनीर']),
        ('handicrafts',    ['craft', 'handicraft', 'pottery', 'weav', 'embroidery', 'knit',
                            'हस्तकला', 'विणकाम', 'कुम्हार', 'कारागिरी']),
        ('retail',         ['shop', 'store', 'retail', 'kirana', 'resell', 'दुकान', 'किराना']),
        ('education',      ['tuition', 'coaching', 'training', 'teach', 'classes', 'course',
                            'शिक्षण', 'कोचिंग', 'ट्रेनिंग']),
        ('technology',     ['software', 'app', 'website', 'digital', 'freelance', 'IT', 'ऑनलाइन सेवा']),
    ]

    business_type_refine = {
        'food_processing': [
            (['millet', 'ragi', 'jowar', 'bajra'], 'Millet / Health Snack Business'),
            (['tiffin', 'dabba', 'meal', 'khana'],  'Tiffin / Meal Delivery'),
            (['pickle', 'achar', 'लोणचे', 'अचार'], 'Pickle / Condiment Business'),
            (['masala', 'spice', 'मसाला'],           'Homemade Spice Business'),
            (['bakery', 'cake', 'bread', 'cookie', 'biscuit'], 'Bakery / Baked Goods'),
            (['snack', 'namkeen', 'chips', 'nuts'], 'Snack / Namkeen Business'),
        ],
        'textiles_apparel': [
            (['boutique', 'designer', 'fashion'], 'Fashion Boutique'),
            (['stitch', 'tailoring', 'silai'],    'Tailoring Business'),
        ],
        'beauty_wellness': [
            (['mehendi', 'mehndi'], 'Mehendi / Henna Artist'),
            (['parlour', 'parlor', 'salon'], 'Beauty Parlour'),
        ],
        'agriculture': [
            (['organic'], 'Organic Farming'),
            (['flower', 'फूल'], 'Flower Farming'),
        ],
    }

    sector = 'other'
    business_type = 'Small Business'
    for sec, kws in sector_map:
        if any(w in text for w in kws):
            sector = sec
            labels = {
                'food_processing': 'Food Business',
                'textiles_apparel': 'Tailoring / Clothing',
                'beauty_wellness': 'Beauty & Wellness',
                'agriculture': 'Agriculture / Farming',
                'dairy': 'Dairy Business',
                'handicrafts': 'Handicrafts',
                'retail': 'Retail / Shop',
                'education': 'Coaching / Training',
                'technology': 'Tech / Digital Services',
            }
            business_type = labels.get(sec, 'Small Business')
            for kwlist, label in business_type_refine.get(sec, []):
                if any(w in text for w in kwlist):
                    business_type = label
                    break
            break

    # ── Language detection ─────────────────────────────────────────
    language = 'English'
    if any('\u0900' <= c <= '\u097f' for c in user_input):
        marathi_words = ['मला', 'आहे', 'करायचे', 'माझ्या', 'आणि', 'सुरू', 'व्यवसाय', 'घरगुती']
        hindi_words   = ['मुझे', 'मैं', 'करना', 'चाहती', 'शुरू', 'है', 'व्यापार', 'धंधा']
        m = sum(1 for w in marathi_words if w in user_input)
        h = sum(1 for w in hindi_words if w in user_input)
        language = 'Marathi' if m >= h else 'Hindi'
    elif any(w in text for w in ['mujhe', 'main ', 'mein ', 'karna', 'chahti', 'shuru',
                                  'mere paas', 'ghar se', 'banana', 'chahiye', 'chahta']):
        language = 'Hindi'  # Hinglish

    # ── Capital extraction ─────────────────────────────────────────
    capital = None
    cap_patterns = [
        (r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)', lambda m: int(float(m.group(1)) * 100000)),
        (r'(\d+(?:\.\d+)?)\s*(?:thousand|thou|हजार|k)\b', lambda m: int(float(m.group(1)) * 1000)),
        (r'around\s+(\d+)\s*(?:thousand|thou|k)\b', lambda m: int(m.group(1)) * 1000),
        (r'₹\s*(\d[\d,]*)', lambda m: int(m.group(1).replace(',', ''))),
        (r'rs\.?\s*(\d[\d,]*)', lambda m: int(m.group(1).replace(',', ''))),
        (r'(\d+)\s*rupees?\b', lambda m: int(m.group(1))),
    ]
    for pattern, converter in cap_patterns:
        match = re.search(pattern, text)
        if match:
            try:
                capital = converter(match)
                break
            except Exception:
                continue

    # ── Location extraction ────────────────────────────────────────
    city_state = {
        'pune': 'Pune, Maharashtra', 'mumbai': 'Mumbai, Maharashtra',
        'nagpur': 'Nagpur, Maharashtra', 'nashik': 'Nashik, Maharashtra',
        'aurangabad': 'Aurangabad, Maharashtra', 'thane': 'Thane, Maharashtra',
        'delhi': 'Delhi', 'noida': 'Noida, Delhi NCR', 'gurgaon': 'Gurgaon, Delhi NCR',
        'bangalore': 'Bangalore, Karnataka', 'bengaluru': 'Bengaluru, Karnataka',
        'hyderabad': 'Hyderabad, Telangana', 'chennai': 'Chennai, Tamil Nadu',
        'coimbatore': 'Coimbatore, Tamil Nadu', 'kolkata': 'Kolkata, West Bengal',
        'ahmedabad': 'Ahmedabad, Gujarat', 'surat': 'Surat, Gujarat',
        'jaipur': 'Jaipur, Rajasthan', 'lucknow': 'Lucknow, Uttar Pradesh',
        'indore': 'Indore, Madhya Pradesh', 'bhopal': 'Bhopal, Madhya Pradesh',
        'patna': 'Patna, Bihar', 'kochi': 'Kochi, Kerala',
        'chandigarh': 'Chandigarh', 'amritsar': 'Amritsar, Punjab',
        'visakhapatnam': 'Visakhapatnam, Andhra Pradesh',
        'vijayawada': 'Vijayawada, Andhra Pradesh',
    }
    states = ['maharashtra', 'gujarat', 'karnataka', 'tamil nadu', 'andhra pradesh',
              'telangana', 'kerala', 'west bengal', 'rajasthan', 'uttar pradesh',
              'madhya pradesh', 'bihar', 'odisha', 'punjab', 'haryana', 'goa', 'assam']

    location = 'Not specified'
    for city, label in city_state.items():
        if city in text:
            location = label
            break
    if location == 'Not specified':
        for state in states:
            if state in text:
                location = state.title()
                break
    if location == 'Not specified' and any(w in text for w in ['village', 'गाँव', 'गाव', 'rural', 'gram', 'gaon']):
        location = 'Rural area'

    # ── Target customers extraction ────────────────────────────────
    customer_patterns = [
        (['student', 'students', 'विद्यार्थी'],                        'Students'),
        (['working professional', 'office worker', 'employee',
          'professionals', 'office'],                                    'Working Professionals'),
        (['housewife', 'homemaker', 'house wife', 'grihasth'],          'Homemakers'),
        (['women', 'mahila', 'महिला'],                                  'Women'),
        (['children', 'kids', 'school'],                                 'Children'),
        (['local', 'neighbourhood', 'neighbor', 'nearby',
          'local shops', 'local market'],                                'Local Customers'),
        (['online', 'whatsapp', 'instagram', 'amazon',
          'flipkart', 'meesho', 'swiggy', 'zomato'],                    'Online Customers'),
        (['restaurant', 'hotel', 'cafe'],                                'Restaurants / Hotels'),
        (['farmer', 'rural', 'village', 'gaon'],                        'Rural Customers'),
        (['corporate', 'company', 'business'],                           'Corporate Clients'),
    ]
    target_customers = []
    for kws, label in customer_patterns:
        if any(w in text for w in kws):
            target_customers.append(label)

    # ── Skills extraction ──────────────────────────────────────────
    skill_patterns = [
        (['cook', 'cooking', 'baking', 'khana banana', 'banana aata'], 'Food preparation'),
        (['millet', 'ragi', 'laddoo', 'ladoo'],                         'Millet / health food making'),
        (['stitch', 'tailoring', 'sewing', 'silai'],                    'Tailoring / Stitching'),
        (['beauty', 'makeup', 'mehendi'],                                'Beauty services'),
        (['farm', 'farming', 'organic'],                                 'Farming / Agriculture'),
        (['craft', 'handicraft', 'embroidery', 'weaving'],              'Handicrafts'),
        (['teach', 'tutor', 'coaching'],                                 'Teaching / Training'),
        (['digital', 'social media', 'instagram', 'whatsapp marketing'], 'Digital marketing'),
    ]
    skills = []
    for kws, label in skill_patterns:
        if any(w in text for w in kws):
            skills.append(label)

    # ── Keywords ───────────────────────────────────────────────────
    kw_pool = ['home', 'homemade', 'online', 'local', 'women', 'millet', 'organic',
               'health', 'healthy', 'snack', 'ragi', 'village', 'rural', 'startup',
               'food', 'spice', 'masala', 'tailoring', 'beauty', 'dairy', 'craft']
    keywords = [sector.replace('_', ' ')] + [w for w in kw_pool if w in text]

    return {
        'language': language,
        'business_type': business_type,
        'sector': sector,
        'location': location,
        'capital': capital,
        'target_customers': target_customers,
        'skills': skills,
        'experience': 'Not specified',
        'business_stage': 'idea',
        'goal': user_input[:300],
        'keywords': list(dict.fromkeys(keywords)),
        'required_support': [],
        'is_vague': False,
        'follow_up_questions': [],
        'raw_response': '',
    }
