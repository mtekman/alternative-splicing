#1/bin/bash
set -e

file=$1
ans_sheet=$2
gen_len=$3

if [ "$gen_len" == "" ]; then
    echo "___Answer Sheet Generator___

This script takes a table of student names (last, first) and generates
answer keys and verdicts for different genome lengths

        usage: $0 <name_table.tsv> <answer_sheet.tsv> <genome-lengths>

where:

 [FILE] name_table.tsv     a TAB separated table, where the first two
                           columns must contain last and first names.

 [STRG] answer_sheet.tsv   the name of the output answer sheet formatted
                           with TAB separation.

 [LIST] genome-length      a list of integer genome lengths separated
                           with commas (NO SPACES).

    e.g. $0 students_table.tsv myanswers.tsv 100,110,120,130,140,150
"
    exit 255
fi

tmp_js=$(mktemp).js
##echo $tmp_js

echo "names = [" > $tmp_js
grep -v "^#" $file \
    | cut -d$'\t' -f 1,2,3 \
    | recode -f utf8..flat \
    | sed 's|-||' \
    | sed -r 's|(.*)@.*|\1|' \
    | sed -s 's|$|\ttest|' \
    | tr '.' ' ' \
    | awk '{print "[\""tolower($1)"\", \""tolower($2)"\"], "}' \
    | sort -k2 >> $tmp_js
sed -i -r '$s|],|]|' $tmp_js
echo -e "];\n" >> $tmp_js

## Generate a temporary Node JS file to calculate verdicts
cat "js/randomwords.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/random.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/determine.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/generate.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/helperfuncs.js" >> $tmp_js;
echo "" >> $tmp_js
cat "js/calc.js" >> $tmp_js;



echo "" >> $tmp_js
echo "
//genome_lengths = [100, 110, 120, 130, 140, 150]
//names.map(x => x.push(rand.akey(x[0], x[1])));
//console.table(names);

genome_lengths = [${gen_len}]

console.log(\"REF SPL ANS GLEN VERDICT\")

for (var n=0; n < names.length; n++){
    var nam = names[n];
    var ref_key = nam[1];
    var spl_key = nam[0]
    for (var g=0; g < genome_lengths.length; g++){
        var gen_len = genome_lengths[g]
        var verd = calc_simulation(spl_key, ref_key, gen_len).verdicts

        if (verd != null){
          var types = verd.map(x => x.type).reduce((acc,it) => acc + ',' + (it || 'None'))
          var sples = verd.map(x => x.vianame).reduce((acc,it) => acc + ',' + (it || 'None'))
          console.log(ref_key, spl_key, rand.akey(ref_key, spl_key), gen_len, sples + ':::' + types)
        } else {
          console.error(ref_key, spl_key, rand.akey(ref_key, spl_key), gen_len, 'FAILED')
        }
    }
}

" >> $tmp_js

node $tmp_js | column -t > $ans_sheet
echo "Generated $(wc -l $ans_sheet) records in $ans_sheet"