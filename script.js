
/** Run once to initialise text boxes updating the SVG on keyup **/
function initUpdateOnTextboxEdit(){
    var updatebutton = document.getElementById("updatebutton")

    function clickUpdate(ev=null){
        updatebutton.click();
        event.preventDefault();
    }

    var textfields = document.querySelectorAll("input[type='text']")
    textfields.forEach(x => {
        x.addEventListener("keyup", clickUpdate)
    })

    var numfield = document.querySelector("input[type='number']")
    numfield.addEventListener("change", event => {
        let gen_len = event.target.valueAsNumber;
        newViewportSize(gen_len);
        rerender(gen_len);
    });
    newViewportSize(numfield.valueAsNumber);
    rerender(numfield.valueAsNumber);

}

function rerender_random(both=false){
    var randwords = words(2);
    document.getElementById("splkey").value = randwords[1];
    both = both || document.getElementById("bothkeys").checked
    if (both){
        document.getElementById("refkey").value = randwords[0];
    }
    rerender();
}

function rerender(nsplice=7){
    var spl_val = document.getElementById("splkey").value,
        ref_val = document.getElementById("refkey").value,
        gen_len = parseInt(document.getElementById("genkey").value);

    if (ref_val === "random"){
        document.getElementById("splkey").value = spl_val = "random";
    }

    splrand = setseed(spl_val);
    refrand = setseed(ref_val);

    var tmp = generateGenome(gen_len, nsplice);
    var genome = tmp.new_ref,
        pos_donors = tmp.don,
        pos_accpts = tmp.acc;

    var exons = generateExons(tmp.new_ref),
        all_possible_pairs = prepareCartesian(pos_donors, pos_accpts);

    var pairings = makeValidSplicePairings(all_possible_pairs);
    var transcriptome_info = determineTranscriptome(genome, pairings);

    renderAll(genome, transcriptome_info, exons, pos_donors, pos_accpts, pairings);
}

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

window.onload = function(){
    svg = d3.select("#svg-div").append("svg")
        .attr('viewBox', '0 0 800 300')
    // all groups are contained within a single parent group
    svg_group = svg.append("g")

    initUpdateOnTextboxEdit()
};
