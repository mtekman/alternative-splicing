
function rerender_random(mode="both"){
    var randwords = words(2);
    document.getElementById("splkey").value = randwords[1];
    if (mode === "both"){
        document.getElementById("refkey").value = randwords[0];
    }
    rerender();
}

function rerender(len=100, nsplice=7){
    var spl_val = document.getElementById("splkey").value,
        ref_val = document.getElementById("refkey").value;

    if (ref_val === "random"){
        document.getElementById("splkey").value = spl_val = "random";
    }       

    splrand = setseed(spl_val);
    refrand = setseed(ref_val);

    var tmp = generateReference(len, nsplice);
    var reference = tmp.new_ref,
        pos_donors = tmp.don,
        pos_accpts = tmp.acc;

    var exons = generateExons(tmp.new_ref),
        all_possible_pairs = prepareCartesian(pos_donors, pos_accpts);

    var pairings = makeValidSplicePairings(all_possible_pairs);
    var splice_verdict = determineTranscripts(pairings, exons);
    
    renderAll(reference, exons, pos_donors, pos_accpts, pairings);
}

/** Determine transcripts from the splice pairings and exon  sequences **/
function determineTranscripts(pairings, exons){
    // First determine whether and where a splice site bisects an exon/intron
    // Then, for each pairing determine whether it's the same exon/intron
    // Finally deliver the modified sequence.
    console.log(pairings, exons);
    for (var p=0; p < pairings.length; p++){
        
    }
}

window.onload = function(){
   
    svg = d3.select("#svg").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);
    rerender();
};
