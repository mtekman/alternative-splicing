const VERSION=0.93;

var svg_div;

var splkey;
var refkey;
var anskey;
var ansdiv;
var genkey;

var clickmode = false;

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

    clickmode = ((new URLSearchParams(window.location.search)).get("mode") === "click")
    if (clickmode){
        document.getElementById("studentmode").style.display = "none"
        document.getElementById("clickmode").style.display = ""
    } else {
        document.getElementById("studentmode").style.display = ""
        document.getElementById("clickmode").style.display = "none"
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
        setURLParams()
        
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
function setURLParams(ref, spl, gen, mod){
    var ref = ref || refkey.value,
        spl = spl || splkey.value,
        gen = gen || genkey.value,
        mod = mod || ""
    if (mod === ""){
        window.history.pushState("","", `index.html?ref=${ref}&spl=${spl}&gen=${gen}`)
    } else {
        window.history.pushState("","", `index.html?ref=${ref}&spl=${spl}&gen=${gen}&mod=${mod}`)
    }
}

/** Called on page load **/
function getURLParams(){
    var defs = new URLSearchParams(window.location.search)
    splkey.value = defs.get("spl")
    refkey.value = defs.get("ref")
    genkey.value = defs.get("gen")
    clickmode = defs.get("mod") === "click"
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
        gen_len = parseInt(genkey.value)

    if (ref_val === "random"){
        splkey.value = spl_val = "random";
    }
    renderAll(calc_simulation(spl_val, ref_val, gen_len), ans_key, clickmode);
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
    if (window.document.documentMode){
        alert("It looks like you're using Internet Explorer...\
\n\nYou can proceed to use this website but please note that\
\nNOTE: THINGS WILL NOT RENDER OR ALIGN PROPERLY.\
\n\nPlease use Firefox or Chrome.")
    }

    document.getElementById("version").innerHTML = "(v" + VERSION + ")"

    svg = d3.select("#svg-div").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
    // all groups are contained within a single parent group
    svg_group = svg.append("g")

    zoomtoggle(false, document.getElementById("zoom"))

    splkey = document.getElementById("splkey")
    refkey = document.getElementById("refkey")
    genkey = document.getElementById("genkey")
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
