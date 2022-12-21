const VERSION=0.91;

var svg_div;
var splkey;
var refkey;
var anskey;
var ansdiv;

/** Run once to initialise text boxes updating the SVG on keyup **/
function initialiseInputs(){
    var updatebutton = document.getElementById("updatebutton")
    updatebutton.onclick = rerender;

    var randombutton = document.getElementById("randombutton")
    randombutton.onclick = rerender_random

    var zoomkey = document.getElementById("zoomkey")
    zoomkey.onclick = function(){
        zoomtoggle(this.checked, this.parentNode);
    }

    function clickUpdate(ev=null){
        updatebutton.click();
        setURLParams()
        ev.preventDefault();
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
    rerender();
}

function rerender_random(){
    var [new_ref, new_spl] = words(2)
    var both = document.getElementById("bothkeys").checked
    splkey.value = new_spl;
    if (both){
        refkey.value = new_ref;
    } else {
        new_ref = refkey.value;
    }
    setURLParams(new_ref, new_spl)
    getURLParams()
    rerender();
}

/** Called by rerender_random before calling rerender **/
function setURLParams(ref, spl){
    var ref = ref || refkey.value,
        spl = spl || splkey.value
    window.history.pushState("","", `index.html?ref=${ref}&spl=${spl}`)
}

/** Called on page load **/
function getURLParams(){
    var defs = new URLSearchParams(window.location.search)
    splkey.value = defs.get("spl")
    refkey.value = defs.get("ref")
    if ((wordList.indexOf(splkey.value)=== -1) ||
        (wordList.indexOf(refkey.value)=== -1)){
        anskey.value = "None Given"
    } else {
        anskey.value = rand.akey(refkey.value, splkey.value)
    }
}

function rerender(){
    var spl_val = splkey.value,
        ref_val = refkey.value,
        ans_key = anskey.value,
        gen_len = parseInt(document.getElementById("genkey").value)

    if (ref_val === "random"){
        splkey.value = spl_val = "random";
    }

    splrand = rand.setseed(spl_val);
    refrand = rand.setseed(ref_val);

    var clean_ref = generateCleanRef(gen_len),
        exon_pos = generatePrecursorExons(clean_ref),
        genome_info = generateGenome(clean_ref, exon_pos),
        genome = genome_info.new_ref,
        splice_pos = genome_info.don_acc,
        exons = generateExons(genome, exon_pos)
    
    var splice_sites = nameSites(splice_pos.don, splice_pos.acc)
    var splice_junctions = makeValidSplicePairings(
        prepareCartesian(splice_pos.don,splice_pos.acc),
        splice_sites
    );
    
    var transcriptome = null,
        exons_spliced = null,
        verdicts = null;
    if (splice_junctions.length > 0){
        transcriptome = determineTranscriptome(genome, splice_junctions);
        splice_info = determineSplicedExons(exons, splice_junctions)
        exons_spliced = splice_info.spliced_exons
        verdicts = splice_info.verdicts
    }
    renderAll(genome, transcriptome, exons,
              splice_sites, splice_junctions, exons_spliced, verdicts,
              ans_key);
}

function zoomtoggle(enable, parentNode){
    const zoom = d3.zoom().on('zoom', e => {
        svg_group.attr("transform", (transform = e.transform));
    });
    svg_div = document.getElementById("svg-div")

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
    document.getElementById("version").innerHTML = "(v" + VERSION + ")"

    svg = d3.select("#svg-div").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
    // all groups are contained within a single parent group
    svg_group = svg.append("g")

    zoomtoggle(false, document.getElementById("zoom"))

    splkey = document.getElementById("splkey")
    refkey = document.getElementById("refkey")
    anskey = document.getElementById("anskey")
    ansdiv = document.getElementById("answer")

    getURLParams()
    initialiseInputs()

    // when history changes, update
    window.onpopstate = function(){
        getURLParams();
        //setURLParams();
        rerender();
    }

    window.onresize = function(){
        newViewportSize(document.getElementById('genkey').valueAsNumber);
    }
    
    // If no keys set, set them.
    if (document.getElementById("refkey").value === ""){
        rerender_random()
    }
};
