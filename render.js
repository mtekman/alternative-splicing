var svg;
var svg_group;
var t; // transition elem

 // pixels per monospace letter
const ppml = {'12px' : 7.21,
              '8px' : 4.8}
const off_col = 10,
      spl_row = 30,
      ref_row = 50,
      exn_row = 90,
      tra_row = 200;

/** Determine the new SVG viewport size based on the genome length **/
function newViewportSize(genome_length){
    var width = (off_col + genome_length) * ppml['12px']
    if (width < 400){
        width = 400
    }
    svg.attr('viewBox', `0 0 ${width} 300`)
}


function renderExons(exons){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Exons on Reference
    var exn_grp = primeGroup("exons", {x:off_col,y:exn_row})
    exons.map((x,i) => x["name"]="Ex" + (i+1));

    let blocks = exn_grp.selectAll("rect"),
        sequences = exn_grp.selectAll("text[class='sequences']"),
        labels = exn_grp.selectAll("text[class='labels']");

    blocks = blocks.data(exons, d => d.name)
        .join(
            enter => enter.append("rect")
                .attr("fill", "grey")
                .attr("height", 30)
                .attr("width", 0)
                .attr("x", d => ppml['12px'] * d.beg)
                .attr("class","shadowdrop"),
            update => update.transition(t)
                .attr("fill", (d,i) => d3.schemeCategory10[i])
                .attr("opacity", "1")
                .attr("width", d => ppml['12px'] * d.len)
                .attr("x", d => ppml['12px'] * d.beg),
            exit => exit.transition(t).remove()
                .attr("opacity", "0")
        ).call(blocks => blocks.transition(t)
               .attr("fill", (d,i) => d3.schemeCategory10[i])
               .attr("height", 30)
               .attr("width", d => ppml['12px'] * d.len)
               .attr("x", d => ppml['12px'] * d.beg));

    sequences = sequences.data(exons, d => d.name)
        .join(
            enter => enter.append("text") // sequence
                .attr("x", d => ppml['12px'] * d.beg)
                .attr("y", 0)
                .attr("class", "sequences")
                .style("font-family", "monospace")
                .attr("fill", "grey")
                .text(d => d.seq),
            update => update.transition(t)
                .attr("x", d => ppml['12px'] * d.beg)
                .text(d => d.seq),
            exit => exit.remove()
        ).call(sequences => sequences.transition(t)
               .attr("y", 0));

    labels = labels.data(exons, d => d.name)
        .join(
            enter => enter.append("text") // label, rotated 90
                .attr("x", d => ppml['12px'] * (d.beg + ((d.end - d.beg)/2) - 2))
                .attr("y", 0)
                .attr("class", "labels")
                .style("font-family", "monospace")
                .attr("fill", "white")
                .text(d => d.name),
            update => update.transition(t)
                .attr("x", d => ppml['12px'] * (d.beg + ((d.end - d.beg)/2) - 2)),
            exit => exit.remove()
        ).call(labels => labels.transition(t)
               .attr("y", 18));
}



function renderPairings(pairings){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Setup Splice Pairings
    var spl_grp = primeGroup("splices", {x:off_col,y:spl_row})

    let blocks = spl_grp.selectAll("rect"),
        texts = spl_grp.selectAll("text");

    blocks = blocks.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("rect")
                .attr("fill", "purple")
                .attr("height", 5)
                .attr("width", 0)
                .attr("x", d => ppml['12px'] * (d.don)),
            update => update.transition(t)
                .attr("x", d => ppml['12px'] * (d.don))
                .attr("width", d => ppml['12px'] * ((d.acc - d.don + 2))),
            exit => exit.transition(t).remove().attr("width", "0")
        ).call(blocks => blocks.transition(t)
               .attr("width", d => ppml['12px'] * ((d.acc - d.don + 2))));

    texts = texts.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("text")
                .attr("x", d => ppml['12px'] * (d.don + ((d.acc - d.don)/2) - 1))
                .attr("y", -20)
                .style("font-family", "monospace")
                .text(""),
            update => update.transition(t)
                .attr("x", d => ppml['12px'] * (d.don + ((d.acc - d.don)/2) - 1))
                .text(d => d.name),
            exit => exit.transition(t).remove().attr("opacity", "0")
        ).call(texts => texts.transition(t)
               .attr("y", 0)
               .text(d => d.name));
}

function renderSpliceJunctions(splice, offset_x){
    var spj_group = primeGroup("spljunc", {x:offset_x, y:tra_row}, true) // bind to tra row



    let poly = spj_group.selectAll("polygon");
    let seqs = spj_group.selectAll("text");

    function makeY(d,i){
        let size = Math.floor(d.size / 10),
            vert = -10*((i%3)+1), // prong
            stct = vert +5;       // prong stem
        let point_arr =
            [`${ppml['12px'] * d.pos},12`            , `${ppml['12px'] * d.pos},${stct}`,
             `${ppml['12px'] * (d.pos-size)},${vert}`, `${ppml['12px'] * d.pos},${stct}`,
             `${ppml['12px'] * (d.pos+size)},${vert}`, `${ppml['12px'] * d.pos},${stct}`
            ]
        return(point_arr.join(" "))
    }

    function seqPlace(d,i){
        return(-10*((i%3)+1)) // prong
    }

    poly = poly.data(splice, d => d)
        .join(
            enter => enter.append("polygon")
                .attr("points", makeY)
                .attr("stroke", "red")
                .attr("stroke-width", 0.5)
                .attr("transform", "translate(0,-200)")
                .attr("opacity", 0),
            update => update.transition(t)
                .attr("points", makeY).attr("opacity", 1),
            exit => exit.transition(t).remove()
                .attr("transform", "translate(0,-200)").attr("opacity", 0)
        ).call(poly => poly.transition(t)
               .attr("transform", "translate(0,0)")
               .attr("opacity", 1));

    seqs = seqs.data(splice, d => d)
        .join(
            enter => enter.append("text")
                .text(d => d.seq)
                .style("font-family", "monospace")
                .style("font-size", "8px")
                .style("fill", "grey")
                .attr("x", d => (d.pos * ppml['12px']) - (ppml['8px'] * d.size/2))
                .attr("y", -400)
                .attr("opacity",0),
            update => update.text(d=>d.seq)
                .attr("x", d => (d.pos * ppml['12px']) - (ppml['8px'] * d.size/2))
                .attr("y", seqPlace).attr("opacity",1),
            exit => exit.transition(t).remove()
                .attr("opacity",0)
                .attr("x", 500)
        ).call(seqs => seqs.transition(t).attr("opacity",1).attr("y", seqPlace))
}

/** Render the transcriptome sequence and center it **/
function renderTranscriptome(transcriptome){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    function calculateLeftOffset(){
        var spliced_out = transcriptome.splice.map(x => x.size).reduce((x,y) => x + y)
        return(Math.floor(ppml['12px'] * spliced_out / 2) + off_col)
    }
    var left_off = calculateLeftOffset()
    renderSequence("trans",
                   {x:left_off, y:tra_row},
                   transcriptome.seq,
                   "Transcriptome",
                   true)

    renderSpliceJunctions(transcriptome.splice, left_off)
}

function renderGenome(seq){
    renderSequence("gen", {x:off_col, y:ref_row}, seq, "Genome")
}


function renderSequence(grp_name, trans_offsets, seq, title_text, update_x_always=false){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);
    // Setup Reference
    var grp = primeGroup(grp_name, trans_offsets, update_x_always);

    let border = grp.selectAll("rect"),
        seqs = grp.selectAll("text[class='sequence']"),
        title = grp.selectAll("text[class='title']")

    border = border.data([{0:seq}], (d,i) => i) // should never change
        .join(
            enter => enter.append("rect")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("class","shadowdrop")
                .attr("width", seq.length * ppml['12px'])
                .attr("height", 13)
                .attr("y", -20),
            update => update.transition(t).attr("width", seq.length * ppml['12px']),
            exit => exit.transition(t).remove()
        ).call(border => border.transition(t)
               .attr("y", 0));

    seqs = seqs.data([{seq:seq}], d => d.seq)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .style("font-size", "12px")
                .text(d => d.seq)
                .attr("class", "sequence")
                .attr("x", 0)
                .attr("y", 11)
                .attr("opacity", 0),
            update => update,
            exit => exit.remove().attr("opacity", "0")
        ).call(seqs => seqs.transition(t).attr("opacity", 1));

    title = title.data([{0:title_text}], (d,i) => i) // Should also never change
        .join(
            enter => enter.append("text")
                .style("font-family", "sans")
                .style("font-size", "8px")
                .attr("class", "title")
                .text(title_text)
                .attr("y", 20)
                .attr("x", -20)
                .attr("opacity", 0),
            update => update,
            exit => exit.transition(t).remove()
        ).call(title => title.transition(t).attr("opacity", 1).attr("x",0))

    return(grp)
}

function renderDonAcc(pos_donors, pos_accpts){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Highlight Donors and Acceptors
    // -- First build a named array
    let don_acc = pos_donors.map(function(x,i){
        return({val:x, name: "D"+i, fill: "red" });
    });
    let acc_arr = pos_accpts.map(function(x,i){
        return({val:x, name: "A"+i, fill: "blue" });
    });
    don_acc.push.apply(don_acc, acc_arr);

    var dac_grp = primeGroup("dac", {x:off_col,y:ref_row})

    let dag = dac_grp.selectAll("text");
    dag = dag.data(don_acc, d => d.name)
        .join(
            enter => enter.append("text")
                .style("font-family", "monospace")
                .text(d => d.name)
                .attr("y", -50)
                .attr("x", d => ppml['12px'] * d.val)
                .attr("fill", d => d.fill),
            update => update.transition(t).attr("x", d => ppml['12px'] * d.val),
            exit => exit.transition(t).remove().attr("opacity", "0")
        ).call(dag => dag.transition(t).attr("y", -2));
}


function renderAll(seq, transcriptome, exons, pos_donors, pos_accpts, pairings){
    renderGenome(seq)
    renderDonAcc(pos_donors, pos_accpts);
    renderExons(exons);
    renderPairings(pairings);
    renderTranscriptome(transcriptome);
    renderSplicedExons(exons, pairings)
}
