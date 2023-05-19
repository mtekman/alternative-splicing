const VERSION=0.93;

var svg_div;

var splkey;
var refkey;
var anskey;
var ansdiv;
var genkey;

var clickmode = false;
var click = {
    check_count: 0,  // Active checked boxes
    real_verdicts : 0 // Real verdicts out of all boxes
}

var appraised_score = [0,1] ; // [right / total]

/** Run once to initialise text boxes updating the SVG on keyup **/
function initialiseInputs(){

    if (clickmode){
        document.getElementById("skipbutton").onclick = rerender_random;
        document.getElementById("checkbutton").onclick = check_verdict;
    } else {
        document.getElementById("updatebutton").onclick = rerender
        document.getElementById("randombutton").onclick = rerender_random

        function clickUpdate(ev=null){
            updatebutton.click();
            setURLParams()
            ev.preventDefault(); // cancels the click event
        }

        document.querySelectorAll("input[type='text']").forEach(x => {
            x.addEventListener("keyup", clickUpdate)
        })

        var numfield = document.querySelector("input[type='number']")
        numfield.addEventListener("change", event => {
            let gen_len = event.target.valueAsNumber;
            newViewportSize(gen_len);
            rerender();
            setURLParams()
        });
        newViewportSize(numfield.valueAsNumber);
    }
    var zoomkey = document.getElementById("zoomkey")
    zoomkey.onclick = function(){
        zoomtoggle(this.checked, this.parentNode);
    }

    rerender(clickmode);
}

function sensible_genlen(){
    // Determine a sensible genome length for the current window size.
    var rec_len = (window.innerWidth / 10) * 1.25
    var ran_len = Math.floor(rec_len + (Math.random()*10) - 5)
    //var new_gen = Math.floor(70 + (200 - 70)*Math.random() / 10) * 10
    //var new_gen = Math.round(60 + (300 - 70) * Math.random())
    return(ran_len)
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
    if (clickmode){
        var new_gen = sensible_genlen()
        setURLParams(new_ref, new_spl, new_gen, "click")
        newViewportSize(new_gen);
    } else {
        setURLParams(new_ref, new_spl)
    }
    getURLParams()
    rerender(clickmode);
}

/** Called by rerender_random before calling rerender **/
function setURLParams(ref, spl, gen, mod){
    var ref = ref || refkey.value,
        spl = spl || splkey.value,
        gen = gen || genkey.value || 100,
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

function clickmode_populate_verdicts(sim){
    var verdicts = sim.verdicts
    verdicts.map(x => {{x.real = true}}) // Mark the real verdicts
    click.real_verdicts = verdicts.length

    // Generate fake verdicts
    var ex_names = sim.exons.map(x => x.name),
        _sites = sim.splice_sites.map(x => x.name),
        ss_accept = _sites.filter(x => x[0] === "A"),
        ss_donor = _sites.filter(x => x[0] === "D"),
        ss_types = Object.keys(types_of_splicing);

    function pickOne(x){
        return(x[Math.floor(Math.random()*x.length)])
    }

    function generateFakeVerdict(){
        var s_accept = pickOne(ss_accept),
            s_donor = pickOne(ss_donor),
            s_type = pickOne(ss_types),
            e_names = [pickOne(ex_names), pickOne(ex_names)];

        var vd = {
            type : s_type,
            desc : types_of_splicing[s_type],
            real : false // Mark the false verdicts
        }
        if (s_type == "IR"){
            vd.where = e_names[0] + "-" + e_names[1]
        } else {
            vd.vianame = s_donor + "-" + s_accept
            vd.where = e_names[0]
        }
        return(vd)
    }

    function verdictText(d){
        let via_text = (d.via == undefined)?"":` via ${d.vianame} (${d.via})`
        return(`${d.desc} at ${d.where}${via_text}`)
    }

    for (var v=verdicts.length; v < 10; v++){
        verdicts.push(generateFakeVerdict())
    }
    // Perform shuffle
    for (let i = verdicts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [verdicts[i], verdicts[j]] = [verdicts[j], verdicts[i]];
    }
    return(verdicts)
}


function rerender(show_clickboxes=false){
    var spl_val = splkey.value,
        ref_val = refkey.value,
        ans_key = anskey.value,
        gen_len = parseInt(genkey.value)

    if (typeof show_clickboxes !== "boolean"){
        show_clickboxes = false;
    }

    if (ref_val === "random"){
        splkey.value = spl_val = "random";
    }
    var sim = calc_simulation(spl_val, ref_val, gen_len)
    if (show_clickboxes){
        generate_click_boxes(sim)
    }
    renderAll(sim, ans_key, show_clickboxes);
}

function generate_click_boxes(sim){
    var verds = clickmode_populate_verdicts(sim)
    var box_opts = document.getElementById("choose_options")
    box_opts.innerHTML = "";

    for (var v=0; v < verds.length; v++){
        let nod = verds[v]
        let div1 = document.createElement("div");
        div1.classList.add("clickbox")
        let div2 = document.createElement("div");
        let div3 = document.createElement("div");

        let str = ""
        str += `<span class="corner">${nod.type}</span>`
        str += `<span class="desc">${nod.desc}</span>`
        str += `<span class="where">${nod.where}`
        str += (nod.type === "IR")?"":` via ${nod.vianame}`
        str += "</span>"
        div1.innerHTML = str
        let cb = document.createElement("input")
        cb.type = "checkbox"
        cb.value = nod.real?"real":""
        //cb.style.display = "none"
        div1.prepend(cb)
        div1.onclick = function(){
            cb.checked = !cb.checked
            check_verdict()
        }
        div2.appendChild(div1)
        div3.appendChild(div2)
        box_opts.appendChild(div3)
    }
    check_verdict()
}

function check_verdict(showresult=false){
    var cor_sel = document.getElementById("sel_cor");
    var incor_sel = document.getElementById("sel_incor");
    var inputs = document.getElementById("choose_options").getElementsByTagName("input");

    var checked = 0,
        trans_time = 500, // must match .transition-out animation time
        real = 0;

    for (var v=0; v < inputs.length; v++){
        real += inputs[v].value==="real"?1:0
        if (inputs[v].checked){
            checked ++;

            let iv = inputs[v]
            let ivp = inputs[v].parentNode
            if (showresult){
                if (iv.value==="real"){
                    ivp.style.borderColor = "blue"
                    ivp.classList.add("transition-out-correct")
                    setTimeout(function(){
                        cor_sel.appendChild(ivp)
                        ivp.classList.remove("transition-out-correct")
                        iv.remove()
                    }, trans_time)
                } else {
                    ivp.style.borderColor = "red"
                    ivp.classList.add("transition-out-incorrect")
                    setTimeout(function(){
                        incor_sel.appendChild(ivp)
                        ivp.classList.remove("transition-out-incorrect")
                        iv.remove()
                    }, trans_time)
                    // remove the inputs here
                    //console.log(inputs[v])
                }
            }
        } else {
            if (showresult){
                inputs[v].parentNode.style.borderColor = "grey"
            }
        }
    }
    if (showresult){
        setTimeout(function(){
            check_verdict(false);
        }, trans_time)
    } else {
        if (real > 0){
            document.getElementById("verdict_counter").textContent = (checked === 0)?
                `Please choose ${real} from below.`:`${checked} / ${real} selected`;
        } else {
            anskey.value = rand.akey(refkey.value, splkey.value)
            rerender(false)
            tally_score()
            //rerender_random()
        }
    }
}

function tally_score(){
    var right_div = document.getElementById("sel_cor"),
        right = right_div.childNodes.length
    var wrong_div = document.getElementById("sel_incor"),
        wrong= wrong_div.childNodes.length;
    //
    var total = right + wrong;
    // delete children
    while (right_div.firstChild){right_div.removeChild(right_div.lastChild)};
    while (wrong_div.firstChild){wrong_div.removeChild(wrong_div.lastChild)};
    // score -- 
    document.getElementById("verdict_counter").textContent = `${right} right and ${wrong} wrong`
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
    if (splkey.value === "" ||  refkey.value === "" | genkey.value === ""){
        rerender_random()
    }


    if (clickmode){
        document.getElementById("studentmode").style.display = "none"
        document.getElementById("clickmode").style.display = ""
    } else {
        document.getElementById("studentmode").style.display = ""
        document.getElementById("clickmode").style.display = "none"
    }
    initialiseInputs()

    // when history changes, update
    window.onpopstate = function(){
        getURLParams();
        //setURLParams();
        rerender(clickmode);
    }

    window.onresize = function(){
        newViewportSize(document.getElementById('genkey').valueAsNumber);
    }

    // If no keys set, set them.
    if (document.getElementById("refkey").value === ""){
        rerender_random()
    }
};
