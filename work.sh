#1/bin/bash

## This script takes a 4-column table of student names  (last, first, email, matriculation) and produces answer keys for them.

file=$1

tmp_js=$(mktemp).js
echo $tmp_js

echo "names = [" > $tmp_js
grep -v "^#" $file \
    | cut -d$'\t' -f 1,2,3 \
    | recode -f utf8..flat \
    | sed 's|-||' \
    | sed -r 's|(.*)@.*|\1|' \
    | sed -s 's|$|\ttest|' \
    |  tr '.' ' ' \
    | awk '{print "[\""tolower($1)"\", \""tolower($2)"\"], "}' \
    | sort -k2 >> $tmp_js
sed -i -r '$s|],|]|' $tmp_js
echo -e "];\n" >> $tmp_js

cat "js/randomwords.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/random.js" >> $tmp_js;

echo "" >> $tmp_js
echo "
names.map(x => x.push(rand.akey(x[0], x[1])));
console.table(names);
" >> $tmp_js

node $tmp_js