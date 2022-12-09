const don="GT",
      acc="AG";

/** Generate a clean reference free of splice sites **/
function generateCleanRef(wanted_len){
    var alpha=['A','C','T','G'],
        last_letter = alpha[Math.floor(refrand()*4)],
        new_seq = last_letter;
    while (new_seq.length < wanted_len){
        var new_letter = "",
            max_tries = 1000;
        while (-- max_tries > 0){
            new_letter = alpha[Math.floor(refrand()*4)];
            if (((last_letter === don[0]) && (new_letter === don[1])) ||
                ((last_letter === acc[0]) && (new_letter === acc[1]))){
                // keep searching!
            } else {
                break
            }
        }
        new_seq += new_letter;
        last_letter = new_letter;
    }
    return(new_seq);
}

/** Add a rough number of splice sites to a clean reference with some spacing **/
function addSpliceSites(clean_ref, exons){
    var acc_normal = exons.map(x => x.beg - 2),
        don_normal = exons.map(x => x.end);

    var nsplice = Math.floor(clean_ref.length / 30)   // 1 spurious ss every 20bp

    // var splice_map = {}
    // for (var p=0; p < acc_normal; p++){
    //     //splice_map[
    // }

    // // Add spurious sites
    // for (var ad=0; ad < nsplice; ad++){
    //     let new_site = Math.floor(1 + refrand() * (clean_ref.length - 1))
    //     if (refrand() > 0.5){
    //         acc_normal.push(new_site)
    //     } else {
    //         don_normal.push(new_site)
    //     }
    // }
    acc_normal.sort((x,y) => x - y)
    don_normal.sort((x,y) => x - y)

    // // Insert the sites at the above positions
    var working_seq = clean_ref;
    function insertSplice(site_arr, site_ss){
        for (let i=0; i < site_arr.length; i++){
            let [left,right] = splitAtIndex(working_seq, site_arr[i])
            left = left.substring(0, left.length)
            right = right.substring(2, right.length)
            working_seq = left + site_ss + right;
        }
    }
    insertSplice(acc_normal, acc)
    insertSplice(don_normal, don)

    return ({new_ref: working_seq,
             don_acc: {
                 don:don_normal,
                 acc:acc_normal}
            });
}

/** Generate a Genome reference of desired length and desired num splice sites **/
function generateGenome(clean_ref, exons){
    return(addSpliceSites(clean_ref, exons));
}


/** Determine exon positions from a reference **/
function generatePrecursorExons(clean_ref, spacing=4, min_s=4, max_s=30){
    var exon_pos = [],
        index = 0,
        exonspace = clean_ref.length / 2; // number of exon spaces

    while (index < clean_ref.length){
        let max_tries = 1000,
            ex_start = 0;
        while (--max_tries > 0){
            ex_start = 1 + index + Math.floor((refrand()*exonspace) / 2)
            if (ex_start > index + spacing){
                break
            }
        }
        var ex_len = Math.floor(min_s + (refrand()*max_s)),
            ex_end = ex_start + ex_len;

        if (ex_start > clean_ref.length){break;}
        if (ex_end > clean_ref.length){
            ex_end = clean_ref.length;
            ex_len = ex_end - ex_start;
            if (ex_len < min_s){break;}
        }
        //ex_seq = clean_ref.substr(ex_start, ex_len);
        exon_pos.push({beg: ex_start, end: ex_end, len: ex_len}); //, seq: ex_seq});
        index = ex_end;
    }
    return(exon_pos);
}

/** Generate ~N Exons within size limits from a clean reference, which will be used to
 * determine positions of normal splice sites **/
function generateExons(ref, exon_positions){
    exon_positions.map(x => x["seq"] = ref.substring(x.beg, x.end))
    return(exon_positions);
}
