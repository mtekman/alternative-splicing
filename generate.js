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
function addSpliceSites(refseq, rough_num, min_space=4){
    var inserts = rough_num * 2; // double for acc and don
    var working_seq = refseq,
        work_len = working_seq.length,
        split_map = {};
    while (--inserts > 0){
        // First define a split and see if it's close to other splits
        // - if it's too close, then try again.
        let max_tries = 1000,
            not_found = true,
            split_map_keys = Object.keys(split_map); // current splits
        var new_split_index;
        while ((--max_tries > 0) && not_found){
            new_split_index = Math.floor(refrand() * work_len);
            // Test it against all other splits
            var passes_all = split_map_keys.length;
            
            for (var s=0; s < split_map_keys.length; s++){
                let old_split_index = split_map[split_map_keys[s]];
                let buff_beg = old_split_index - min_space,
                    buff_end = old_split_index + min_space;
                if ((new_split_index > buff_beg) && (new_split_index < buff_end)){
                    // keep searching!
                } else {
                    // valid against one split
                    passes_all--;
                }
            }
            if (passes_all === 0){break;}
        }
        if (max_tries <= 0){
            console.error("Failed");
        }
        var [left,right] = splitAtIndex(working_seq, new_split_index);
        // correct for the 2bp insertion
        left = left.substring(0,left.length-1);
        right = right.substring(1,right.length);
        middle = ((refrand() > 0.5)?acc:don); // donor or acceptor sequence
        working_seq = left + middle + right;
        // finally replace any accidental AGT's with AAGGGT, to prevent double donor acceptor overlap.
        working_seq = working_seq.split("AGT").join("ACT");
        //
        split_map[new_split_index] = new_split_index; // "10" = 10
    }
    
    // Scan for acc and don
    var don_pos = getIndicesOf(don, working_seq);
    var acc_pos = getIndicesOf(acc, working_seq);
    
    return ({cln_ref: refseq, new_ref:working_seq,
             don:don_pos, acc:acc_pos});
}

/** Generate a Genome reference of desired length and desired num splice sites **/
function generateGenome(wanted_len, nsplice){
    return(addSpliceSites(generateCleanRef(wanted_len), nsplice));
}


/** Generate ~N Exons within size limits from a reference **/
function generateExons(ref, nexons=5, min_s=5, max_s=30){
    var exons = [],
        index = 0,
        exonspace = ref.length / 2; // number of exon spaces

    while (index < ref.length){
        var ex_start = 1 + index + Math.floor((refrand()*exonspace) / 2),
            // divide 2 again to increase chance of early start in the exon space
            ex_len = Math.floor(min_s + (refrand()*max_s)),
            ex_end = ex_start + ex_len;

        if (ex_start > ref.length){break;}
        if (ex_end > ref.length){
            ex_end = ref.length;
            ex_len = ex_end - ex_start;
            if (ex_len < min_s){break;}
        }
        ex_seq = ref.substr(ex_start, ex_len);
        exons.push({beg: ex_start, end: ex_end, len: ex_len, seq: ex_seq});
        index = ex_end;
    }
    return(exons);
}
