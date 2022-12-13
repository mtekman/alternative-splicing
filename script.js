
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

function rerender(){
    var spl_val = document.getElementById("splkey").value,
        ref_val = document.getElementById("refkey").value,
        gen_len = parseInt(document.getElementById("genkey").value);

    if (ref_val === "random"){
        document.getElementById("splkey").value = spl_val = "random";
    }

    splrand = setseed(spl_val);
    refrand = setseed(ref_val);

    var clean_ref = generateCleanRef(gen_len),
        exon_pos = generatePrecursorExons(clean_ref),
        genome_info = generateGenome(clean_ref, exon_pos),
        genome = genome_info.new_ref,
        splice_pos = genome_info.don_acc,
        exons = generateExons(genome, exon_pos)
    //var pos_donors_accpts = {dons: tmp.don, accs: tmp.acc};

    var all_possible_pairs = prepareCartesian(splice_pos.don, splice_pos.acc);
    var splice = makeValidSplicePairings(all_possible_pairs);

    var transcriptome = null,
        exons_spliced = null;
    if (splice.length > 0){
        transcriptome = determineTranscriptome(genome, splice);
        exons_spliced = determineSplicedExons(exons, splice)
        //console.log(exons, exons_spliced)
    }
    renderAll(genome, transcriptome, exons,
              splice_pos, splice, exons_spliced);
}

function zoomtoggle(enable, parentNode){
    const zoom = d3.zoom().on('zoom', e => {
        svg_group.attr("transform", (transform = e.transform));
    });
    const svg_div = document.getElementById("svg-div")

    function hoverOn(node){node.style.opacity="0.5"}
    function hoverOff(node){node.style.opacity="1"}
    
    if (enable) {
        svg.call(zoom)
        svg.style.border = ""
        parentNode.style.opacity = "1"
        parentNode.onmouseover = undefined;
        parentNode.onmouseout = undefined;
        //svg_div.style.background = "white"
        //svg_div.style.borderRadius = "20px"
    }
    else {
        svg.on('.zoom', null)
        svg.style("border", "")
        parentNode.style.opacity = "0.1"
        //svg_div.style.border = ""
        parentNode.onmouseover = function(){parentNode.style.opacity="1";}
        parentNode.onmouseout = function(){parentNode.style.opacity="0.1";}
    }
    parentNode.style.filter = "drop-shadow(2px 2px 5px #0000ff)"
}


window.onload = function(){
    svg = d3.select("#svg-div").append("svg")
    // all groups are contained within a single parent group
    svg_group = svg.append("g")

    zoomtoggle(false, document.getElementById("zoom"))
    
    initUpdateOnTextboxEdit()
};
