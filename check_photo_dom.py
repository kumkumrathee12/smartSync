import re

with open('resume/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Check photo styling in HTML
p_css = html.find('.hero-photo')
print("CSS for .hero-photo:")
print(html[p_css:p_css+500])

# Check where hero-photo appears in DOM
p_dom = html.find('class="hero-photo"')
print("\nDOM for hero-photo:")
print(html[p_dom-100:p_dom+300])
