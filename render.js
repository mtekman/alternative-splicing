var svg;

const ppml = 7.21; // pixels per monospace letter
const off_col = 10
const spl_row = 30
const ref_row = 50
const exn_row = 80

var t; // transition elem


function renderExons(exons){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Exons on Reference
    var exn_grp = primeGroup("exons", function(d){
        let x = off_col,
            y = exn_row;
        return(`translate(${x},${y})`)
    })
    exons.map((x,i) => x["name"]="Ex" + (i+1))

    let blocks = exn_grp.selectAll("rect")
    let texts = exn_grp.selectAll("text[class='sequences']")
    let labels = exn_grp.selectAll("text[class='labels']")

    blocks = blocks.data(exons, d => d.name)
        .join(
            enter => enter.append("rect")
                .attr("fill", "grey")
                .attr("height", 30)
                .attr("width", 0)
                .attr("x", d => ppml * d.beg),
            update => update.transition(t)
                .attr("width", d => ppml * d.len)
                .attr("x", d => ppml * d.beg),
            exit => exit.transition(t).remove()
                .attr("fill", "white")
        ).call(blocks => blocks.transition(t)
               .attr("fill", (d,i) => d3.schemeCategory10[i])
               .attr("height", 30)
               .attr("width", d => ppml * d.len)
               .attr("x", d => ppml * d.beg))

    texts = texts.data(exons, d => d.name)
        .join(
            enter => enter.append("text") // sequence
                .attr("x", d => ppml * d.beg)
                .attr("y", 0)
                .attr("class", "sequences")
                .style("font-family", "monospace")
                .text(d => d.seq),
            update => update.transition(t)
                .attr("x", d => ppml * d.beg)
                .text(d => d.seq),
            exit => exit.remove()
        ).call(texts => texts.transition(t)
               .attr("y", 0))

    labels = labels.data(exons, d => d.name)
        .join(
            enter => enter.append("text") // label, rotated 90
                .attr("x", d => ppml * (d.beg + ((d.end - d.beg)/2) - 2))
                .attr("y", 0)
                .attr("class", "labels")
                .style("font-family", "monospace")
                .attr("fill", "white")
                .text(d => d.name),
            update => update.transition(t)
                .attr("x", d => ppml * (d.beg + ((d.end - d.beg)/2) - 2)),
            exit => exit.remove()
        ).call(texts => texts.transition(t)
               .attr("y", 18))
}



function renderPairings(pairings){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Splice Pairings
    var spl_grp = primeGroup("splices", function(d){
        let x = off_col,
            y = spl_row;
        return(`translate(${x},${y})`)
    })

    let blocks = spl_grp.selectAll("rect")
    let texts = spl_grp.selectAll("text")

    blocks = blocks.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("rect")
                .attr("fill", "purple")
                .attr("height", 5)
                .attr("width", 0)
                .attr("x", d => ppml * (d.don+2)),
            update => update.transition(t)
                .attr("x", d => ppml * (d.don+2))
                .attr("width", d => ppml * ((d.acc - d.don) - 2)),
            exit => exit.transition(t).remove().attr("width", "0")
        ).call(blocks => blocks.transition(t)
               .attr("width", d => ppml * ((d.acc - d.don) - 2)))

    texts = texts.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("text")
                .attr("x", d => ppml * (d.don + ((d.acc - d.don)/2) - 1))
                .attr("y", -20)
                .style("font-family", "monospace")
                .text(""),
            update => update.transition(t)
                .attr("x", d => ppml * (d.don + ((d.acc - d.don)/2) - 1))
                .text(d => d.name),
            exit => exit.remove().attr("fill", "white")
        ).call(texts => texts.transition(t)
               .attr("y", 0)
               .text(d => d.name))
}

function renderRefDonAcc(seq, pos_donors, pos_accpts){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Reference
    var ref_grp = primeGroup("ref", function(d){
        let x = off_col,
            y = ref_row;
        return(`translate(${x},${y})`)
    })
    let border = ref_grp.selectAll("rect")
    let texts = ref_grp.selectAll("text")

    let data_ref = [{seq:seq}]

    border = border.data(data_ref, (d,i) => i) // should never change
        .join(
            enter => enter.append("rect")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("width", seq.length * ppml)
                .attr("height", 13)
                .attr("x", -200),
            update => update.transition(t).attr("width", seq.length * ppml),
            exit => exit.transition(t).remove()
        ).call(border => border.transition(t)
               .attr("x", 0))

    texts = texts.data(data_ref, d => d.seq)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .text(seq)
                .attr("x", -200)
                .attr("y", 11),
            update => update,
            exit => exit.transition(t).remove().attr("fill", "white")
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

    var dac_grp = primeGroup(
        "dac", function(d){
            let x = off_col,
                y = ref_row; // mirror reference, with some offset
            return(`translate(${x},${y})`)
        })

    let dag = dac_grp.selectAll("text")
    dag = dag.data(don_acc, d => d.name)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .text(d => d.name)
                .attr("y", -50)
                .attr("x", d => ppml * d.val)
                .attr("fill", d => d.fill),
            update => update.transition(t).attr("x", d => ppml * d.val),
            exit => exit.transition(t).remove().attr("fill", "white")
        ).call(dag => dag.transition(t).attr("y", -2))
}


function renderAll(seq, exons, pos_donors, pos_accpts, pairings){
    renderRefDonAcc(seq, pos_donors, pos_accpts)
    renderExons(exons)
    renderPairings(pairings)
}
