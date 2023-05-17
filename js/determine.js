const types_of_splicing = {
    "CS" : "Constitutive Splicing",
    "ES" : "Exon Skipping",
    "AA" : "Alternative 3’ Acceptor",
    "AD" : "Alternative 5’ Donor",
    "IR" : "Intron Retention"
}


/** Determine transcripts from the splice pairings and exon  sequences **/
function determineTranscriptome(genome, pairings){
    // First determine whether and where a splice site bisects an exon/intron
    // Then, for each pairing determine whether it's the same exon/intron
    // Finally deliver the modified sequence.
    var transcriptome=[], genome_map = [],
        last_cut_index = 0;
    for (var p=0; p < pairings.length; p++){
        // Slice the genome
        transcriptome.push(genome.substring(last_cut_index, pairings[p].don))
        genome_map.push({beg: last_cut_index, end: pairings[p].don})
        last_cut_index = pairings[p].acc + 2
    }
    genome_map.push({beg: last_cut_index, end: genome.length})
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
    return({seq:transcriptome.join(""), go2tr:genome_map, splice:splice_pos});
}


/** Determine the sequences of spliced exons, and provide a judgement **/
function determineSplicedExons(exons, splice){
    // For each exon (beg,end), check the splice site (acc, don) overlap
    var spliced_exons = [];
    var cumul_previous_shortening = 0;
    var verdicts = [] ; // what type of splicing and where

    for (var e=0; e < exons.length; e++){
        var exon = exons[e],
            ex_beg = exon.beg,
            ex_end = exon.end;

        // we build a list of positions to slice, then slice them in reverse position
        // order to keep the positions relevant after each operation
        var positions_to_slice_out = [],
            exon_shortening = 0; // count the previous splice sites and subtract from exon
                                 // start to get the new position of the exon on the
                                 // transcript
        for (var s=0; s < splice.length; s++){
            var ssite = splice[s],
                ss_beg = ssite.don, ss_end = ssite.acc;

            if (e > 0){
                if (((ss_end + 2) === ex_beg) && (ss_beg == exons[e-1].end)){
                    verdicts.push({type: "CS", where: exon.name,
                                   via: ssite.name, vianame: ssite.sites})
                    exon_shortening += (ss_end + 2 - ss_beg)
                    continue;
                }
            }

            
            if (ss_beg > ex_end){
                continue; // reject ss if out of bounds
            }
            if (ss_end < ex_beg){
                exon_shortening += (ss_end + 2 - ss_beg)
                continue; // also reject if OOB, but store info because it affects the exon start
            }
            // We deal with the x or more splice sites that can splice an Exon
            // into the 4 Scenarios:
            //
            // 1) Splice completely overlaps exon (deletes exon)
            if ((ss_beg <= ex_beg) && (ss_end >= ex_end)){
                positions_to_slice_out.push([ex_beg, ex_end])
                verdicts.push({type:"ES", where: exon.name,
                               via: ssite.name, vianame: ssite.sites})
                break;
            }
            // 2) Splice is contained wholly within exon
            else if ((ss_beg > ex_beg) && (ss_end < ex_end)){
                positions_to_slice_out.push([ss_beg, ss_end + 2]) // 2 for size of ss
                verdicts.push({type:"IR", where: exon.name,
                               via: ssite.name, vianame: ssite.sites})
            }
            // 3) Splice begin overlaps end of exon
            else if ((ss_beg > ex_beg) && (ss_beg < ex_end) && (ss_end > ex_end)){
                positions_to_slice_out.push([ss_beg, ex_end])
                verdicts.push({type:"AD", where: exon.name,
                               via: ssite.name, vianame: ssite.sites})
            }
            // 4) Splice end overlaps begin of exon
            else if ((ss_beg < ex_beg) && (ss_end > ex_beg)){
                exon_shortening += (ex_beg - ss_beg)
                positions_to_slice_out.push([ex_beg, ss_end + 2])
                verdicts.push({type:"AA", where: exon.name,
                               via: ssite.name, vianame: ssite.sites})
            }
        }
        // Sort the positions to slice out, and reverse
        positions_to_slice_out.sort((x,y) => y[1] - x[1])
        // Slice
        var working_exon = exon.seq;
        for (var p=0; p < positions_to_slice_out.length; p++){
            var slice_pair = positions_to_slice_out[p]
            working_exon =
                splitAtIndex(working_exon, slice_pair[0] - exon.beg)[0] +
                "" +
                splitAtIndex(working_exon, slice_pair[1] - exon.beg)[1];
            //
        }
        var new_beg = ex_beg - (exon_shortening),
            new_len = working_exon.length,
            new_end = new_beg + new_len;
        
        // 100 step tone, duty yard
        spliced_exons.push({beg: new_beg, end: new_end,
                            len: new_len, name: exon.name,
                            seq: working_exon})
        //cumul_previous_shortening = exon.seq.length - working_exon.length;
    }
    // Find intron retention
    // BUG: index.html?ref=lost&spl=block&gen=203 -- first IR block block wrong
    var nointrons = spliced_exons
         // remove zero-length exons from search
        .filter(x => x.len > 0).sort((x,r) => x.beg - r.beg)
        // search for exons with NO space in between
        .map((x,i, arr) => {
            if (i < arr.length - 1){
                //if (parseInt(arr[i][2]) +   CHECK CONSECUTIVE
                return({
                    noint: arr[i].end == arr[i+1].beg,
                    at: arr[i].name + "-" + arr[i+1].name
                    //at: "before " + arr[i+1].name
                })
            };
            return({  // last exon
                noint: true,
                at: arr[i].name})
        })
    var introns_found = !(nointrons.every(x => x.noint == true))
    if (introns_found){
        for (let i=0; i < nointrons.length; i++){
            if (nointrons[i].noint === false){
                verdicts.push({type:"IR", where: nointrons[i].at,
                               via: null, vianame: null})
            }
        }
    }
    // append description to verdicts
    verdicts.forEach(x => x.desc = types_of_splicing[x.type])
    
    return({spliced_exons: spliced_exons, verdicts: verdicts})
}
