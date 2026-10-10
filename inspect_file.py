with open('resume/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print("File size:", len(text))
print("Has base64 data:image:", "data:image" in text)
pos = text.find('data:image')
if pos != -1:
    print("Base64 starts at:", pos, "snippet:", text[pos-50:pos+100])
else:
    print("Searching for photo or img tag...")
    for tag in ['<img', 'photo', 'avatar', 'profile-img', 'hero']:
        p = text.find(tag)
        print(f"'{tag}' found at: {p}")
        if p != -1:
            print(f"Snippet for '{tag}':", text[p:p+200])
