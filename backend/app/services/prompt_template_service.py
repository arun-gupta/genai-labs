from typing import Dict, List, Optional
from enum import Enum


class TemplateCategory(str, Enum):
    CREATIVE = "creative"
    BUSINESS = "business"
    TECHNICAL = "technical"
    ACADEMIC = "academic"
    PERSONAL = "personal"


class PromptTemplate:
    def __init__(self, id: str, name: str, description: str, category: TemplateCategory, 
                 system_prompt: str, user_prompt_template: str, variables: List[str]):
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.system_prompt = system_prompt
        self.user_prompt_template = user_prompt_template
        self.variables = variables
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "system_prompt": self.system_prompt,
            "user_prompt_template": self.user_prompt_template,
            "variables": self.variables
        }


class PromptTemplateService:
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> List[PromptTemplate]:
        """Initialize predefined prompt templates."""
        return [
            # Creative Templates
            PromptTemplate(
                id="story_writer",
                name="Story Writer",
                description="Generate creative stories with engaging plots and characters",
                category=TemplateCategory.CREATIVE,
                system_prompt="You are a creative storyteller who writes engaging, imaginative stories with vivid descriptions and compelling characters.",
                user_prompt_template="Write a {genre} story about {topic} with {tone} tone. The story should be approximately {length} words long.",
                variables=["genre", "topic", "tone", "length"]
            ),
            PromptTemplate(
                id="poet",
                name="Poet",
                description="Create beautiful poetry in various styles and forms",
                category=TemplateCategory.CREATIVE,
                system_prompt="You are a skilled poet who creates beautiful, evocative poetry with rich imagery and emotional depth.",
                user_prompt_template="Write a {style} poem about {theme}. The poem should be {mood} in tone and approximately {length} lines long.",
                variables=["style", "theme", "mood", "length"]
            ),
            PromptTemplate(
                id="blog_writer",
                name="Blog Writer",
                description="Generate engaging blog posts with SEO optimization",
                category=TemplateCategory.CREATIVE,
                system_prompt="You are a professional blog writer who creates engaging, informative content that ranks well in search engines.",
                user_prompt_template="Write a blog post about {topic} targeting {audience}. The post should be {length} words long and include {key_points} key points.",
                variables=["topic", "audience", "length", "key_points"]
            ),
            
            # Business Templates
            PromptTemplate(
                id="email_writer",
                name="Email Writer",
                description="Create professional emails for various business scenarios",
                category=TemplateCategory.BUSINESS,
                system_prompt="You are a professional business communicator who writes clear, concise, and effective emails.",
                user_prompt_template="Write a {email_type} email to {recipient} about {subject}. The tone should be {tone} and the email should be {length} words long.",
                variables=["email_type", "recipient", "subject", "tone", "length"]
            ),
            PromptTemplate(
                id="proposal_writer",
                name="Proposal Writer",
                description="Generate business proposals and project outlines",
                category=TemplateCategory.BUSINESS,
                system_prompt="You are an expert business proposal writer who creates compelling, well-structured proposals.",
                user_prompt_template="Write a business proposal for {project_type} targeting {client}. Include {sections} main sections and make it {length} words long.",
                variables=["project_type", "client", "sections", "length"]
            ),
            PromptTemplate(
                id="marketing_copy",
                name="Marketing Copy",
                description="Create compelling marketing copy for various channels",
                category=TemplateCategory.BUSINESS,
                system_prompt="You are a skilled marketing copywriter who creates persuasive, conversion-focused content.",
                user_prompt_template="Write {content_type} marketing copy for {product} targeting {audience}. The copy should be {tone} and {length} words long.",
                variables=["content_type", "product", "audience", "tone", "length"]
            ),
            
            # Technical Templates
            PromptTemplate(
                id="code_explainer",
                name="Code Explainer",
                description="Explain complex code concepts and algorithms",
                category=TemplateCategory.TECHNICAL,
                system_prompt="You are a software engineer who explains complex technical concepts in clear, accessible language.",
                user_prompt_template="Explain {concept} in {programming_language} for a {skill_level} developer. Include {examples} examples and make it {length} words long.",
                variables=["concept", "programming_language", "skill_level", "examples", "length"]
            ),
            PromptTemplate(
                id="documentation_writer",
                name="Documentation Writer",
                description="Generate technical documentation and user guides",
                category=TemplateCategory.TECHNICAL,
                system_prompt="You are a technical writer who creates clear, comprehensive documentation that helps users understand complex systems.",
                user_prompt_template="Write {doc_type} documentation for {software} targeting {audience}. Include {sections} sections and make it {length} words long.",
                variables=["doc_type", "software", "audience", "sections", "length"]
            ),
            PromptTemplate(
                id="troubleshooting_guide",
                name="Troubleshooting Guide",
                description="Create step-by-step troubleshooting guides",
                category=TemplateCategory.TECHNICAL,
                system_prompt="You are a technical support specialist who creates clear, step-by-step troubleshooting guides.",
                user_prompt_template="Create a troubleshooting guide for {issue} in {system}. Include {steps} steps and make it {length} words long.",
                variables=["issue", "system", "steps", "length"]
            ),
            
            # Academic Templates
            PromptTemplate(
                id="essay_writer",
                name="Essay Writer",
                description="Generate academic essays with proper structure",
                category=TemplateCategory.ACADEMIC,
                system_prompt="You are an academic writer who creates well-structured, evidence-based essays with proper citations.",
                user_prompt_template="Write a {essay_type} essay about {topic} for {academic_level}. The essay should be {length} words long with {paragraphs} paragraphs.",
                variables=["essay_type", "topic", "academic_level", "length", "paragraphs"]
            ),
            PromptTemplate(
                id="research_summary",
                name="Research Summary",
                description="Summarize research papers and academic articles",
                category=TemplateCategory.ACADEMIC,
                system_prompt="You are a research analyst who creates concise, accurate summaries of academic research.",
                user_prompt_template="Summarize the research on {topic} focusing on {aspect}. The summary should be {length} words long and include {key_findings} key findings.",
                variables=["topic", "aspect", "length", "key_findings"]
            ),
            PromptTemplate(
                id="literature_review",
                name="Literature Review",
                description="Generate literature reviews for academic papers",
                category=TemplateCategory.ACADEMIC,
                system_prompt="You are an academic researcher who writes comprehensive literature reviews that synthesize existing research.",
                user_prompt_template="Write a literature review on {topic} covering {time_period}. The review should be {length} words long and include {sources} key sources.",
                variables=["topic", "time_period", "length", "sources"]
            ),
            
            # Personal Templates
            PromptTemplate(
                id="journal_entry",
                name="Journal Entry",
                description="Create reflective journal entries and personal writing",
                category=TemplateCategory.PERSONAL,
                system_prompt="You are a thoughtful writer who helps people reflect on their experiences and emotions.",
                user_prompt_template="Write a journal entry about {experience} with {emotion} emotions. The entry should be {length} words long and {style} in style.",
                variables=["experience", "emotion", "length", "style"]
            ),
            PromptTemplate(
                id="goal_setter",
                name="Goal Setter",
                description="Generate personal goal-setting and planning content",
                category=TemplateCategory.PERSONAL,
                system_prompt="You are a life coach who helps people set meaningful goals and create actionable plans.",
                user_prompt_template="Create a goal-setting plan for {goal_type} with {timeline}. Include {steps} actionable steps and make it {length} words long.",
                variables=["goal_type", "timeline", "steps", "length"]
            ),
            PromptTemplate(
                id="gratitude_practice",
                name="Gratitude Practice",
                description="Create gratitude exercises and positive reflection content",
                category=TemplateCategory.PERSONAL,
                system_prompt="You are a mindfulness coach who helps people practice gratitude and positive thinking.",
                user_prompt_template="Create a gratitude practice for {occasion} focusing on {aspect}. Include {exercises} exercises and make it {length} words long.",
                variables=["occasion", "aspect", "exercises", "length"]
            )
        ]
    
    def get_all_templates(self) -> List[Dict]:
        """Get all available templates."""
        return [template.to_dict() for template in self.templates]
    
    def get_templates_by_category(self, category: TemplateCategory) -> List[Dict]:
        """Get templates filtered by category."""
        filtered_templates = [t for t in self.templates if t.category == category]
        return [template.to_dict() for template in filtered_templates]
    
    def get_template_by_id(self, template_id: str) -> Optional[PromptTemplate]:
        """Get a specific template by ID."""
        for template in self.templates:
            if template.id == template_id:
                return template
        return None
    
    def get_categories(self) -> List[str]:
        """Get all available template categories."""
        return [category.value for category in TemplateCategory]
    
    def fill_template(self, template_id: str, variables: Dict[str, str]) -> Dict[str, str]:
        """Fill a template with provided variables."""
        template = self.get_template_by_id(template_id)
        if not template:
            raise ValueError(f"Template with ID '{template_id}' not found")
        
        # Fill system prompt
        system_prompt = template.system_prompt
        
        # Fill user prompt template
        user_prompt = template.user_prompt_template
        for var_name, value in variables.items():
            if var_name in template.variables:
                user_prompt = user_prompt.replace(f"{{{var_name}}}", value)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "template_info": template.to_dict()
        }


# Global instance
prompt_template_service = PromptTemplateService() 