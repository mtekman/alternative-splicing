
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

    var splice = makeValidSplicePairings(all_possible_pairs);
    var transcriptome = determineTranscriptome(genome, splice);
    var exons_spliced = determineSplicedExons(exons, splice)

    renderAll(genome, transcriptome, exons, pos_donors, pos_accpts, splice);
}



window.onload = function(){
    svg = d3.select("#svg-div").append("svg")
        .attr('viewBox', '0 0 800 300')
    // all groups are contained within a single parent group
    svg_group = svg.append("g")

    initUpdateOnTextboxEdit()
};
