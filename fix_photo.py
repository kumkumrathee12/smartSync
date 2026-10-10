import re

with open('resume/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the hero-photo div and its base64 image
pattern = r'<div class="hero-photo" id="hero-photo">[\s\S]*?</div>'

replacement = '''<div class="hero-photo" id="hero-photo">
        <img src="photo.jpg" alt="Kumkum Rathee" onerror="this.onerror=null; this.src='https://avatars.githubusercontent.com/u/223988210?v=4';" />
        <div class="photo-ring r1"></div>
        <div class="photo-ring r2"></div>
      </div>'''

new_content = re.sub(pattern, replacement, content, count=1)

with open('resume/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement complete. New length:", len(new_content))
