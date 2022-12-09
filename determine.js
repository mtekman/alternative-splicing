/** Determine transcripts from the splice pairings and exon  sequences **/
function determineTranscriptome(genome, pairings){
    // First determine whether and where a splice site bisects an exon/intron
    // Then, for each pairing determine whether it's the same exon/intron
    // Finally deliver the modified sequence.
    var transcriptome=[],
        last_cut_index = 0
    for (var p=0; p < pairings.length; p++){
        // Slice the genome
        transcriptome.push(genome.substring(last_cut_index, pairings[p].don))
        last_cut_index = pairings[p].acc + 2
    }
    transcriptome.push(genome.substring(last_cut_index, genome.length))

    function getSizeandSequence(pos, pair){
        var size = (pair.acc + 2) - pair.don;
        var seq = genome.substring(pair.don, pair.acc + 2)
        return({pos:pos, seq:seq,size:size})
    }

    if (pairings.length < 1){
        return({seq:genome, splice:[{pos:0, seq:0}]});
    } 
    
    var splice_pos = [getSizeandSequence(transcriptome[0].length, pairings[0])],
        cumul = splice_pos[0].pos;
    for (var s=1; s < transcriptome.length; s++){
        var tlen = transcriptome[s].length
        var spl = pairings[s]
        var currlen = cumul + tlen;
        if (tlen > 0 && spl !== undefined){
                splice_pos.push(getSizeandSequence(currlen, pairings[s]))
        }
        cumul = currlen
    }
    return({seq:transcriptome.join(""), splice:splice_pos});
}


/** Determine the sequences of spliced exons, and provide a judgement **/
function determineSplicedExons(exons, splice){
    // For each exon (beg,end), check the splice site (acc, don) overlap
    var spliced_exons = []

    for (var e=0; e < exons.length; e++){
        var exon = exons[e],
            ex_beg = exon.beg, ex_end = exon.end;

        // we build a list of positions to slice, then slice them in reverse position
        // order to keep the positions relevant after each operation
        var positions_to_slice_out = [];

        for (var s=0; s < splice.length; s++){
            var ssite = splice[s],
                ss_beg = ssite.don, ss_end = ssite.acc;

            if ((ss_beg > ex_end) || (ss_end < ex_beg)){
                continue; // reject ss if out of bounds
            }

            // We deal with the x or more splice sites that can splice an Exon
            // into the 4 Scenarios:
            //
            // 1) Splice completely overlaps exon (deletes exon)
            if ((ss_beg <= ex_beg) && (ss_end >= ex_end)){
                positions_to_slice_out.push([ex_beg, ex_end])
                break;
            }
            // 2) Splice is contained wholly within exon
            else if ((ss_beg > ex_beg) && (ss_end < ex_end)){
                positions_to_slice_out.push([ss_beg, ss_end + 2]) // 2 for size of ss
            }
            // 3) Splice begin overlaps end of exon
            else if ((ss_beg > ex_beg) && (ss_end > ex_end)){
                positions_to_slice_out.push([ss_beg, ex_end])
            }
            // 4) Splice end overlaps begin of exon
            else if ((ss_beg < ex_beg) && (ss_end > ex_beg)){
                positions_to_slice_out.push([ex_beg, ss_end + 2])
            }
        }
        // Sort the positions to slice out, and reverse
        positions_to_slice_out.sort((x,y) => y[1] - x[1])
        // Slice
        var working_exon = exon.seq
        for (var p=0; p < positions_to_slice_out.length; p++){
            var slice_pair = positions_to_slice_out[p]
            working_exon =
                splitAtIndex(working_exon, slice_pair[0] - exon.beg)[0] +
                "" +
                splitAtIndex(working_exon, slice_pair[1] - exon.beg)[1];

            
        }
        spliced_exons.push(working_exon)
    }
    return(spliced_exons)
}
