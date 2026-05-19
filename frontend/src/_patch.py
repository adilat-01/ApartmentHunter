path = r"c:\Users\97251\OneDrive\Desktop\ApartmentHunter\frontend\src\MainWorkspace.tsx"
lines = open(path, encoding="utf-8").readlines()

start = next(i for i, l in enumerate(lines) if "activeTab === 'dashboard'" in l)
end = None
for i in range(start, len(lines)):
    if lines[i].strip() == "</>" and i > start + 10:
        end = i
        break

block = open(
    r"c:\Users\97251\OneDrive\Desktop\ApartmentHunter\frontend\src\_dashboard_snippet.txt",
    encoding="utf-8",
).read()
lines = lines[:start] + [block + "\n"] + lines[end + 1 :]

start2 = next(i for i, l in enumerate(lines) if "drawerOpen" in l)
end2 = None
for i in range(start2, len(lines)):
    if lines[i].strip() == "</>" and i > start2 + 5:
        end2 = i
        break
lines = lines[:start2] + lines[end2 + 1 :]

open(path, "w", encoding="utf-8", newline="\n").writelines(lines)
print("ok", start, end, start2, end2)
