from rest_framework import serializers
from .models import (
    BusinessIdea, AIAnalysis, GovernmentScheme, Mentor, NGO,
    SchemeMatch, MentorMatch, NGOMatch
)


class GovernmentSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentScheme
        fields = [
            'id', 'name', 'description', 'ministry', 'state', 'sector',
            'gender', 'min_capital', 'max_capital', 'eligibility_text',
            'benefits_text', 'documents_required', 'official_website',
            'business_stages', 'active',
        ]


class MentorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentor
        fields = [
            'id', 'name', 'expertise', 'sectors', 'languages',
            'state', 'district', 'experience_years', 'bio',
            'availability', 'contact_method', 'business_stages',
        ]


class NGOSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGO
        fields = [
            'id', 'name', 'description', 'state', 'district',
            'focus_areas', 'services', 'languages',
            'women_support', 'entrepreneurship_support',
            'contact', 'website',
        ]


class SchemeMatchSerializer(serializers.ModelSerializer):
    scheme = GovernmentSchemeSerializer(read_only=True)

    class Meta:
        model = SchemeMatch
        fields = ['scheme', 'match_score', 'semantic_score', 'rule_score', 'match_reasons']


class MentorMatchSerializer(serializers.ModelSerializer):
    mentor = MentorSerializer(read_only=True)

    class Meta:
        model = MentorMatch
        fields = ['mentor', 'match_score', 'match_reasons']


class NGOMatchSerializer(serializers.ModelSerializer):
    ngo = NGOSerializer(read_only=True)

    class Meta:
        model = NGOMatch
        fields = ['ngo', 'match_score', 'match_reasons']


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = [
            'business_type', 'sector', 'location', 'capital',
            'target_customers', 'skills', 'experience', 'business_stage',
            'goal', 'keywords', 'required_support', 'is_vague',
            'follow_up_questions', 'created_at',
        ]


class BusinessIdeaSerializer(serializers.ModelSerializer):
    analysis = AIAnalysisSerializer(read_only=True)
    scheme_matches = SchemeMatchSerializer(many=True, read_only=True)
    mentor_matches = MentorMatchSerializer(many=True, read_only=True)
    ngo_matches = NGOMatchSerializer(many=True, read_only=True)

    class Meta:
        model = BusinessIdea
        fields = [
            'id', 'original_text', 'detected_language', 'is_voice_input',
            'title', 'created_at', 'updated_at',
            'analysis', 'scheme_matches', 'mentor_matches', 'ngo_matches',
        ]
