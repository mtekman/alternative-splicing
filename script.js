
function rerender(len=100, nsplice=7){
    var spl_val = document.getElementById("splkey").value,
        ref_val = document.getElementById("refkey").value;

    splrand = setseed(spl_val);
    refrand = setseed(ref_val);

    var tmp = generateReference(len, nsplice);
    var reference = tmp.new_ref,
        pos_donors = tmp.don,
        pos_accpts = tmp.acc;

    var exons = generateExons(tmp.new_ref),
        all_possible_pairs = prepareCartesian(pos_donors, pos_accpts);

    var pairings = makeValidSplicePairings(all_possible_pairs);
    renderAll(reference, exons, pos_donors, pos_accpts, pairings);
}

window.onload = function(){
   
    svg = d3.select("#salt").append("svg")
        .attr("width", 1000)
        .attr("height", 667);

    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);
    rerender();
};
