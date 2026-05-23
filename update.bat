@echo off
cd "c:\Users\yvess\OneDrive\Desktop\New folder\old"
copy /Y index_temp.html index.html
del index_new.html
del index_temp.html
echo ✓ Files updated successfully
