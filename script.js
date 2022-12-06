const seq="ATGAAATTTTTCCGTAAACCCGAGCCCCCGTCTGATTAGCCCGTCCCAGACGTACACACAGATTGA"
const don="GT"
const acc="AG"

const exons = ["ATGAAATTTTTCC",
               "CCCCC",
               "CCCGTCCCAGAC",
               "ATTGA"]

var pos_exons = exons.map(x => seq.indexOf(x)),
    pos_donors = getIndicesOf(don, seq),
    pos_accpts = getIndicesOf(acc, seq)

var all_possible_pairs = prepareCartesian(pos_donors, pos_accpts)

const ppml = 7.21; // pixels per monospace letter
const off_col = 10
const ref_row = 20
const exn_row = 40
const spl_row = 50
var t; // transition elem

function renderPairings(pairings){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Splice Pairings
    var spl_grp = d3.select("#splices")
    if (spl_grp.empty()){
        spl_grp = svg.append("g").attr("id", "splices")
            .attr("transform", function(d){
                let x = off_col,
                    y = spl_row;
                return(`translate(${x},${y})`)
            })
    }

    let blocks = spl_grp.selectAll("rect")
    let texts = spl_grp.selectAll("text")
    
    blocks = blocks.data(pairings, d => d.name)
        .join(
            enter => enter.append("rect")
                .attr("fill", "grey")
                .attr("height", 30)
                .attr("width", 0)
                .attr("x", d => ppml * d.don),
            update => update,
            exit => exit.transition(t).remove()
                .attr("y", -100)
        ).call(blocks => blocks.transition(t)
               .attr("fill", (d,i) => d3.schemeCategory10[i])
               .attr("height", 30)
               .attr("width", d => ppml * (d.acc - d.don))
               .attr("x", d => ppml * d.don))

    texts = texts.data(pairings, d => d.name)
        .join(
            enter => enter.append("text")
                .attr("x", d => ppml * d.don)
                .attr("y", -20)
                .style("font-family", "monospace")
                .text(""),
            update => update,
            exit => exit.remove()
        ).call(texts => texts.transition(t)
               .attr("x", d => ppml * d.don)
               .attr("y", 0)
               .text(d => d.don + "-" + d.acc))
}

function renderRefDonAcc(seq, pos_donors, pos_accpts){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);
    
    // Setup Reference
    var ref_grp = d3.select("#ref")
    if (ref_grp.empty()){
        ref_grp = svg.append("g").attr("id", "ref")
            .attr("transform", function(d){
            let x = off_col,
                y = ref_row;
            return(`translate(${x},${y})`)
            })
    }

    let border = ref_grp.selectAll("rect")
    let texts = ref_grp.selectAll("text")

    let data_ref = [{0:seq}]
    
    border = border.data(data_ref, d => d)
        .join(
            enter => enter.append("rect")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("width", seq.length * ppml)
                .attr("height", 13)
                .attr("x", -200),
            update => update,
            exit => exit.transition(t).remove().attr("y", -20)
        ).call(border => border.transition(t)
               .attr("x", 0))
            
    texts = texts.data(data_ref, d => d)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .text(seq)
                .attr("x", -200)
                .attr("y", 11),
            update => update,
            exit => exit.transition(t).remove().attr("y", -20)
        ).call(texts => texts.transition(t)
               .attr("x", 0))


    // Highlight Donors and Acceptors
    // -- First build a named array
    let don_acc = pos_donors.map(function(x,i){
        return({val:x, name: "D"+i, fill: "red" })
    });
    let acc_arr = pos_accpts.map(function(x,i){
        return({val:x, name: "A"+i, fill: "blue" })
    });
    don_acc.push.apply(don_acc, acc_arr)

    var dac_grp = d3.select("#dac")
    if (dac_grp.empty()){
        dac_grp = svg.append("g").attr("id", "dac")
            .attr("transform", function(d){
                let x = off_col,
                    y = ref_row; // mirror reference, with some offset
                return(`translate(${x},${y})`)
            })
    }
    let dag = dac_grp.selectAll("text")
    dag = dag.data(don_acc, d => d.name)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .text(d => d.name)
                .attr("y", -50)
                .attr("x", d => ppml * d.val)
                .attr("fill", d => d.fill),
            update => update,
            exit => exit.transition(t).remove().attr("y", -20)
        ).call(dag => dag.transition(t).attr("y", -2))
}


function renderAll(seq, pos_exons, pos_donors, pos_accpts, pairings){
    renderRefDonAcc(seq, pos_donors, pos_accpts)
    renderPairings(pairings)

    // Show Exons
    var exn_grp = svg.append("g")
        .attr("id", "exons")
        .attr("transform", function(d){
            let x = off_col,
                y = exn_row;
            return(`translate(${x},${y})`)
        })

}

function rerender(){
    var spl_val = document.getElementById("splkey").value
    var ref_val = document.getElementById("refkey").value

    splrand = setseed(spl_val)
    refrand = setseed(ref_val)    
        
    var pairings = makeValidSplicePairings()
    renderAll(seq, pos_exons, pos_donors, pos_accpts, pairings)
}

var svg;

window.onload = function(){
    svg = d3.select("#salt").append("svg")
        .attr("width", 1000)
        .attr("height", 667)

    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);
    rerender()

}
