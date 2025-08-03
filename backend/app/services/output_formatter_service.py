import json
import yaml
import re
from typing import Dict, List, Any, Optional
from app.models.requests import OutputFormat


class OutputFormatterService:
    """Service for formatting responses in different output formats."""
    
    def __init__(self):
        self.format_instructions = {
            OutputFormat.JSON: "Format your response as valid JSON. Use proper JSON syntax with quotes around keys and string values.",
            OutputFormat.XML: "Format your response as valid XML. Use proper XML tags and structure.",
            OutputFormat.MARKDOWN: "Format your response using Markdown syntax. Use headers, lists, bold, italic, and other Markdown formatting.",
            OutputFormat.CSV: "Format your response as CSV data. Use commas to separate values and newlines for rows.",
            OutputFormat.YAML: "Format your response as valid YAML. Use proper YAML syntax with indentation.",
            OutputFormat.HTML: "Format your response as valid HTML. Use proper HTML tags and structure.",
            OutputFormat.BULLET_POINTS: "Format your response as bullet points using • or - symbols.",
            OutputFormat.NUMBERED_LIST: "Format your response as a numbered list using 1., 2., 3., etc.",
            OutputFormat.TABLE: "Format your response as a table using Markdown table syntax with | separators and header rows.",
            OutputFormat.TEXT: "Provide a clear, well-structured text response."
        }
    
    def get_format_instruction(self, output_format: OutputFormat) -> str:
        """Get the format instruction for the specified output format."""
        return self.format_instructions.get(output_format, "Provide a clear, well-structured response.")
    
    def format_system_prompt(self, base_prompt: str, output_format: OutputFormat) -> str:
        """Add output format instructions to the system prompt."""
        format_instruction = self.get_format_instruction(output_format)
        return f"{base_prompt}\n\n{format_instruction}"
    
    def validate_and_format_response(self, response: str, output_format: OutputFormat) -> Dict[str, Any]:
        """Validate and format the response based on the output format."""
        result = {
            "formatted_content": response,
            "is_valid": True,
            "validation_message": "Valid format",
            "original_content": response
        }
        
        try:
            if output_format == OutputFormat.JSON:
                # Try to parse as JSON to validate
                json.loads(response)
                result["formatted_content"] = response
                
            elif output_format == OutputFormat.XML:
                # Basic XML validation
                if not self._is_valid_xml(response):
                    result["is_valid"] = False
                    result["validation_message"] = "Invalid XML format"
                result["formatted_content"] = response
                
            elif output_format == OutputFormat.YAML:
                # Try to parse as YAML to validate
                yaml.safe_load(response)
                result["formatted_content"] = response
                
            elif output_format == OutputFormat.CSV:
                # Basic CSV validation
                if not self._is_valid_csv(response):
                    result["is_valid"] = False
                    result["validation_message"] = "Invalid CSV format"
                result["formatted_content"] = response
                
            elif output_format == OutputFormat.HTML:
                # Basic HTML validation
                if not self._is_valid_html(response):
                    result["is_valid"] = False
                    result["validation_message"] = "Invalid HTML format"
                result["formatted_content"] = response
                
            elif output_format == OutputFormat.BULLET_POINTS:
                # Format as bullet points if not already
                result["formatted_content"] = self._format_as_bullet_points(response)
                
            elif output_format == OutputFormat.NUMBERED_LIST:
                # Format as numbered list if not already
                result["formatted_content"] = self._format_as_numbered_list(response)
                
            elif output_format == OutputFormat.TABLE:
                # Format as table if not already
                result["formatted_content"] = self._format_as_table(response)
                
            else:
                # TEXT, MARKDOWN - no special validation needed
                result["formatted_content"] = response
                
        except Exception as e:
            result["is_valid"] = False
            result["validation_message"] = f"Format validation failed: {str(e)}"
            result["formatted_content"] = response
        
        return result
    
    def _is_valid_xml(self, text: str) -> bool:
        """Basic XML validation."""
        # Check for basic XML structure
        has_open_tags = bool(re.search(r'<[^/][^>]*>', text))
        has_close_tags = bool(re.search(r'</[^>]+>', text))
        return has_open_tags and has_close_tags
    
    def _is_valid_csv(self, text: str) -> bool:
        """Basic CSV validation."""
        lines = text.strip().split('\n')
        if len(lines) < 1:
            return False
        
        # Check if lines contain commas
        return any(',' in line for line in lines)
    
    def _is_valid_html(self, text: str) -> bool:
        """Basic HTML validation."""
        # Check for basic HTML structure
        has_open_tags = bool(re.search(r'<[^/][^>]*>', text))
        has_close_tags = bool(re.search(r'</[^>]+>', text))
        return has_open_tags and has_close_tags
    
    def _format_as_bullet_points(self, text: str) -> str:
        """Format text as bullet points."""
        lines = text.strip().split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                # If line doesn't already start with a bullet point, add one
                if not re.match(r'^[\•\-\*]\s', line):
                    formatted_lines.append(f"• {line}")
                else:
                    formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    def _format_as_numbered_list(self, text: str) -> str:
        """Format text as a numbered list."""
        lines = text.strip().split('\n')
        formatted_lines = []
        counter = 1
        
        for line in lines:
            line = line.strip()
            if line:
                # If line doesn't already start with a number, add one
                if not re.match(r'^\d+\.\s', line):
                    formatted_lines.append(f"{counter}. {line}")
                    counter += 1
                else:
                    formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    def _format_as_table(self, text: str) -> str:
        """Format text as a Markdown table."""
        lines = text.strip().split('\n')
        
        # If it's already a table, return as is
        if any('|' in line for line in lines):
            return text
        
        # Try to extract key-value pairs or structured data
        table_data = []
        for line in lines:
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                table_data.append([key.strip(), value.strip()])
        
        if table_data:
            # Create Markdown table
            table_lines = []
            table_lines.append("| Key | Value |")
            table_lines.append("|-----|-------|")
            for key, value in table_data:
                table_lines.append(f"| {key} | {value} |")
            return '\n'.join(table_lines)
        
        return text


# Global instance
output_formatter_service = OutputFormatterService() 