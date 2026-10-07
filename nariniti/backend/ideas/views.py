import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import CookieJWTAuthentication
from .models import (
    BusinessIdea, AIAnalysis, GovernmentScheme, Mentor, NGO,
    SchemeMatch, MentorMatch, NGOMatch
)
from .serializers import BusinessIdeaSerializer
from .ai.gemini_service import extract_business_profile, transcribe_audio_with_gemini
from .matching.scheme_matcher import match_schemes
from .matching.mentor_matcher import match_mentors
from .matching.ngo_matcher import match_ngos

logger = logging.getLogger(__name__)


def _run_analysis(profile: dict, idea: BusinessIdea):
    """Save AIAnalysis and compute + save all match results."""
    AIAnalysis.objects.update_or_create(
        idea=idea,
        defaults={
            'business_type': profile.get('business_type', ''),
            'sector': profile.get('sector', 'other'),
            'location': profile.get('location', 'Not specified'),
            'capital': profile.get('capital'),
            'target_customers': profile.get('target_customers', []),
            'skills': profile.get('skills', []),
            'experience': profile.get('experience', 'Not specified'),
            'business_stage': profile.get('business_stage', 'idea'),
            'goal': profile.get('goal', ''),
            'keywords': profile.get('keywords', []),
            'required_support': profile.get('required_support', []),
            'is_vague': profile.get('is_vague', False),
            'follow_up_questions': profile.get('follow_up_questions', []),
            'raw_gemini_response': {'raw': profile.get('raw_response', '')},
        }
    )

    bt = profile.get('business_type', '')
    if bt:
        idea.title = bt[:200]
        idea.detected_language = profile.get('language', 'English')
        idea.save(update_fields=['title', 'detected_language'])

    # Scheme matching
    schemes = GovernmentScheme.objects.filter(active=True)
    scheme_results = match_schemes(profile, schemes)
    SchemeMatch.objects.filter(idea=idea).delete()
    for r in scheme_results:
        SchemeMatch.objects.create(
            idea=idea, scheme=r['scheme'],
            match_score=r['match_score'], semantic_score=r['semantic_score'],
            rule_score=r['rule_score'], match_reasons=r['match_reasons'],
        )

    # Mentor matching
    mentor_results = match_mentors(profile, Mentor.objects.all())
    MentorMatch.objects.filter(idea=idea).delete()
    for r in mentor_results:
        MentorMatch.objects.create(
            idea=idea, mentor=r['mentor'],
            match_score=r['match_score'], match_reasons=r['match_reasons'],
        )

    # NGO matching
    ngo_results = match_ngos(profile, NGO.objects.all())
    NGOMatch.objects.filter(idea=idea).delete()
    for r in ngo_results:
        NGOMatch.objects.create(
            idea=idea, ngo=r['ngo'],
            match_score=r['match_score'], match_reasons=r['match_reasons'],
        )

    return BusinessIdeaSerializer(idea).data


class AnalyzeIdeaView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        input_text = (request.data.get('input_text') or '').strip()
        if not input_text:
            return Response({'error': 'Please describe your business idea.'}, status=400)
        if len(input_text) < 5:
            return Response({'error': 'Please provide more detail about your idea.'}, status=400)
        try:
            profile = extract_business_profile(input_text)
            idea = BusinessIdea.objects.create(
                user=request.user, original_text=input_text,
                detected_language=profile.get('language', 'English'), is_voice_input=False,
            )
            return Response(_run_analysis(profile, idea), status=201)
        except Exception as e:
            logger.error(f'Idea analysis error: {e}', exc_info=True)
            return Response({'error': 'Analysis failed. Please try again.'}, status=500)


class AnalyzeAudioView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'error': 'No audio file received.'}, status=400)
        try:
            result = transcribe_audio_with_gemini(audio_file.read(), audio_file.content_type or 'audio/webm')
            transcription = result.get('transcription', '')
            if not transcription:
                return Response({'error': 'Could not transcribe audio. Please type your idea.', 'fallback': True}, status=422)
            profile = result.get('profile', {})
            idea = BusinessIdea.objects.create(
                user=request.user, original_text=transcription,
                detected_language=profile.get('language', 'English'), is_voice_input=True,
            )
            data = _run_analysis(profile, idea)
            data['transcription'] = transcription
            return Response(data, status=201)
        except Exception as e:
            logger.error(f'Audio analysis error: {e}', exc_info=True)
            return Response({'error': 'Audio processing failed. Please type your idea instead.'}, status=500)


class SaveIdeaView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            idea = BusinessIdea.objects.get(pk=pk, user=request.user)
            return Response({'message': 'Idea saved.', 'id': idea.id}, status=200)
        except BusinessIdea.DoesNotExist:
            return Response({'error': 'Idea not found.'}, status=404)


class BusinessIdeaListView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ideas = BusinessIdea.objects.filter(user=request.user).prefetch_related(
            'analysis', 'scheme_matches__scheme', 'mentor_matches__mentor', 'ngo_matches__ngo'
        )
        return Response(BusinessIdeaSerializer(ideas, many=True).data)


class BusinessIdeaDetailView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            idea = BusinessIdea.objects.prefetch_related(
                'analysis', 'scheme_matches__scheme', 'mentor_matches__mentor', 'ngo_matches__ngo'
            ).get(pk=pk, user=request.user)
            return Response(BusinessIdeaSerializer(idea).data)
        except BusinessIdea.DoesNotExist:
            return Response({'error': 'Idea not found.'}, status=404)

    def delete(self, request, pk):
        try:
            BusinessIdea.objects.get(pk=pk, user=request.user).delete()
            return Response(status=204)
        except BusinessIdea.DoesNotExist:
            return Response({'error': 'Idea not found.'}, status=404)


class DashboardStatsView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ideas = BusinessIdea.objects.filter(user=request.user)
        recent = ideas.order_by('-created_at')[:5]
        recent_activity = [
            {'type': 'idea', 'text': f"Saved: {idea.title or idea.original_text[:40]}",
             'date': idea.created_at.isoformat(), 'id': idea.id}
            for idea in recent
        ]
        return Response({
            'ideas_saved': ideas.count(),
            'schemes_matched': SchemeMatch.objects.filter(idea__user=request.user).values('scheme').distinct().count(),
            'mentors_connected': MentorMatch.objects.filter(idea__user=request.user).values('mentor').distinct().count(),
            'recent_activity': recent_activity,
        })
