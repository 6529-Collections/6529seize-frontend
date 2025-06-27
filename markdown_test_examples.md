# Markdown Line Break Examples

This document shows examples of markdown content with different line break patterns based on the codebase analysis.

## Examples Found in Tests

### Example 1: Single Line Break (from AgreementStepAgreement.test.tsx)
```markdown
# Title
[link](https://example.com)
```

### Example 2: List with Double Line Break (from AgreementStepAgreement.test.tsx)
```markdown
- item

`code`
```

## Common Patterns Based on Component Analysis

### Pattern 1: Paragraph with Single Line Break
This would appear as:
```
First paragraph content
Second paragraph content
```

### Pattern 2: Paragraph with Double Line Break (proper paragraph separation)
This would appear as:
```
First paragraph content

Second paragraph content
```

### Pattern 3: Mixed Content with Line Breaks
```
This is some text
And this continues on next line

But this starts a new paragraph

And here's another paragraph with
a line break within it
```

## How DropPartMarkdown Handles Line Breaks

Based on the DropPartMarkdown.tsx component analysis:

1. **Single `\n`**: Creates a line break within the same paragraph
2. **Double `\n\n`**: Creates separate paragraphs with spacing
3. **renderParagraph function**: Handles paragraph rendering with `tw-space-y-1` class for spacing
4. **Whitespace handling**: Uses `tw-whitespace-pre-wrap` to preserve line breaks

## Test Content Examples

### Basic Content
```
partContent: "Test content"
```

### Content with Line Break  
```
partContent: "First line\nSecond line"
```

### Content with Paragraph Break
```
partContent: "First paragraph\n\nSecond paragraph"
```

### Mixed Content
```
partContent: "# Heading\n\nThis is a paragraph.\n\nAnother paragraph with [link](https://example.com)"
```