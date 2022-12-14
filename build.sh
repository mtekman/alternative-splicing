#!/bin/bash

## pacman -S uglify-js python-rcssmin

pub_dir="deploy"
pub_html="$pub_dir/index.html"

tmp_dir="temp"
tmp_js="$tmp_dir/minmang.js"
tmp_css="$tmp_dir/minmang.css"

mkdir -p $pub_dir $tmp_dir;

## Mangle and compress JS and CSS
uglifyjs js/*.js --rename --no-annotations -c -m --validate --toplevel --ie -o $tmp_js
sed -i -r "1s|^|<script>|" $tmp_js
echo "</script>" >> $tmp_js

echo "<style>" > $tmp_css
python -c 'from rcssmin import cssmin; print(cssmin(open("style.css", "r").read()))' >> $tmp_css
echo "</style>" >> $tmp_css

## Create initial public HTML without CSS and JS
cat index.html | grep -vP "(<script src=|<link rel=\"stylesheet\")" > $pub_html

## Paste all temp CS and JS into public HTML
sed -i "/\/head/e cat $tmp_css" $pub_html
sed -i "/External Libraries/e cat $tmp_js" $pub_html

rm -rf $tmp_dir