var svg;
var svg_group;
var t; // transition elem

 // pixels per monospace letter
const ppml = {'12px' : 7.21,
              '8px' : 4.8}
const off_col = 10,
      spl_row = 30,
      ref_row = 46,
      exn_row = 90,
      tra_row = 200,
      esp_row = 240;

const exon_height = 30,
      intron_height = 5;

/** Determine the new SVG viewport size based on the genome length **/
function newViewportSize(genome_length){
    var width = (off_col + genome_length) * ppml['12px']
    if (width < 400){
        width = 400
    }
    svg.attr('viewBox', `0 0 ${width} 300`)
}

function renderGenomeExons(exons){
    // Setup Exons on Reference
    renderExons(exons, "genome-exons", {x:off_col,y:exn_row})
}


function renderExons(exons, grpname, offsets, update_always=false){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    var exn_grp = primeGroup(grpname, offsets, update_always)

    let blocks = exn_grp.selectAll("rect"),
        sequences = exn_grp.selectAll("text[class='sequences']"),
        labels = exn_grp.selectAll("text[class='labels']");

    // Exons with a non-zero sequence length. We still feed the blocks the original data
    // to preserve the colouring though.
    var filter_exons = exons.filter(d => d.len > 0)
    
    blocks = blocks.data(exons, d => d.name)
        .join(
            enter => enter.append("rect")
                .attr("fill", "grey")
                .attr("height", exon_height)
                .attr("width", 0)
                .attr("y", -50)
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
               .attr("height", exon_height)
               .attr("width", d => ppml['12px'] * d.len)
               .attr("y", 0)
               .attr("x", d => ppml['12px'] * d.beg));

    sequences = sequences.data(filter_exons, d => d.name)
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

    labels = labels.data(filter_exons, d => d.name)
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

    let blocks = spl_grp.selectAll("polyline"),
        texts = spl_grp.selectAll("text");

    const y_l1 = 4, y_l2 = -1, y_l3 = y_l2, y_l4 = -4;

    function makeC(d,i){
        let x_left = ppml['12px'] * (d.don + 0.3),
            x_right = ppml['12px'] * (d.acc + 1.7),
            x_mid = ppml['12px'] * (1 + d.don + ((d.acc - d.don)/2))

        let point_arr =
            [`${x_left},${y_l1}`, `${x_left},${y_l2}`,
             `${x_mid - 2},${y_l3}`,
             `${x_mid},${y_l4}`,
             `${x_mid + 2},${y_l3}`,
             `${x_right},${y_l2}`, `${x_right},${y_l1}`
             //`${x_left},${y_bott}`,
            ]
        return(point_arr.join(" "))
    }

    pairings = pairings.filter(x => x.don !== null)

    blocks = blocks.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("polyline")
                .attr("fill", "none")
                .attr("stroke", "purple")
                .attr("stroke-width", 2.3)
                .attr("points", makeC),
            update => update.transition(t)
                .attr("points", makeC),
            exit => exit.transition(t).remove().attr("transform", "translate(0,-40)")
        ).call(blocks => blocks.transition(t));

    texts = texts.data(pairings, (d,i) => i)
        .join(
            enter => enter.append("text")
                .attr("x", d => ppml['12px'] * (d.don + ((d.acc - d.don)/2) - 1.5))
                .attr("y", -20)
                .style("font-family", "monospace")
                .text(""),
            update => update.transition(t)
                .attr("x", d => ppml['12px'] * (d.don + ((d.acc - d.don)/2) - 1.5))
                .text(d => d.name),
            exit => exit.transition(t).remove().attr("opacity", "0")
        ).call(texts => texts.transition(t)
               .attr("y", -y_l1)
               .text(d => d.name));
}

function renderSpliceJunctions(splice, offset_x){
    var spj_group = primeGroup("spljunc", {x:offset_x, y:tra_row}, true) // bind to tra row

    let poly = spj_group.selectAll("polyline");
    let seqs = spj_group.selectAll("text");

    function makeY(d,i){
        let size = ppml['8px'] * Math.floor(d.size/2),
            x_margin = 3,
            x_mid = ppml['12px'] * d.pos,
            x_left = x_mid - (size + x_margin),
            x_right = x_mid + (size + x_margin),
            y_needle = 80,
            y_tips = -10*((i%3)+1),
            y_midpoint = y_tips + 3;      // prong stem

        let point_arr =
            [`${x_mid},${y_needle}`,     // needle
             `${x_mid},${y_midpoint}`,   // mid-point Y
             `${x_right},${y_tips}`,     // right-tip Y
             `${x_right},${y_tips - 4}`, // right-tip Y - Up
             `${x_right},${y_tips}`,     // right-tip Y
             `${x_mid},${y_midpoint}`,   // mid-point Y
             `${x_left},${y_tips}`,      // left-tip Y
             `${x_left},${y_tips - 4}`,      // left-tip Y - Up
             `${x_left},${y_tips}`,      // left-tip Y
             `${x_mid},${y_midpoint}`    // mid-point Y
            ]
        return(point_arr.join(" "))
    }

    function seqPlace(d,i){
        return(-10*((i%3)+1)) // prong
    }

    splice = splice.filter(x => x.seq !== null)
    
    poly = poly.data(splice, (d,i) => i)
        .join(
            enter => enter.append("polyline")
                .attr("points", makeY)
                .attr("stroke", "purple")
                .attr("stroke-width", 1.5)
                .attr("fill", "none")
                .attr("transform", "translate(0,-200)")
                .attr("opacity", 0),
            update => update.transition(t)
                .attr("points", makeY).attr("opacity", 1),
            exit => exit.transition(t).remove()
                .attr("transform", "translate(0,-200)").attr("opacity", 0)
        ).call(poly => poly.transition(t)
               .attr("transform", "translate(0,0)")
               .attr("opacity", 1));

    seqs = seqs.data(splice, (d,i) => i)
        .join(
            enter => enter.append("text")
                .text(d => d.seq)
                .style("font-family", "monospace")
                .style("font-size", "8px")
                .style("fill", "grey")
                .attr("x", d => (d.pos * ppml['12px']) - (ppml['8px'] * d.size/2))
                .attr("y", -400)
                .attr("opacity",0),
            update => update.transition(t).text(d => d.seq)
                .attr("x", d => (d.pos * ppml['12px']) - (ppml['8px'] * d.size/2))
                .attr("y", seqPlace).attr("opacity",1),
            exit => exit.transition(t).remove()
                .attr("opacity",0)
                .attr("x", 500)
        ).call(seqs => seqs.transition(t).attr("opacity",1).attr("y", seqPlace))
}

/** Render the transcriptome sequence and center it. Return padding offset to use for
 * spliced exon positioning **/
function renderTranscriptome(transcriptome, left_off){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    renderSequence("trans",
                   {x:left_off, y:tra_row},
                   transcriptome.seq,
                   "Transcriptome",
                   true)
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

function renderDonAcc(pos_donors_accpts){
    t = svg.transition().duration(1000).delay(-300).ease(d3.easeCubic);

    // Highlight Donors and Acceptors
    // -- First build a named array
    let don_acc = pos_donors_accpts.don.map(function(x,i){
        return({val:x, name: "D"+i, fill: "red" });
    });
    let acc_arr = pos_donors_accpts.acc.map(function(x,i){
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

function renderSplicedExons(spliced_exons, transcript_offset){
    // Setup Exons on Transcipt
    renderExons(spliced_exons, "transcript-exons", {x:transcript_offset,y:esp_row}, true)
}

function renderGenomeIntrons(exons){
    renderIntrons(exons, "genome-introns", {x:off_col, y:exn_row}, update_always=false)
}

// If any!
function renderSplicedIntrons(exons, loff){
    renderIntrons(exons, "transcript-introns", {x:loff, y:esp_row}, update_always=true)
}

function renderIntrons(exons, grp_name, offset, update_always=false){
    // Determine Intron positions
    var introns = exons
        .filter(x => x.len > 0)
        .sort((x,y) => x.beg - y.beg)
        .reduce((acc,x,i,arr) => {
            if (i == 0){acc = []}
            else {acc.push([arr[i-1].end, arr[i].beg])};
            return(acc)
        }, [])
        .filter(x => (x[1] - x[0] > 0))
        .map(x => {return({beg:x[0], end:x[1], len:x[1] - x[0]})})
    //console.log(introns)

    let int_offset = offset;
    int_offset.y = int_offset.y + (exon_height/2) - (intron_height/2);

    let int_group = primeGroup(grp_name, int_offset, update_always)
    let blocks = int_group.selectAll("rect");
    
    blocks = blocks.data(introns, (d,i) => i)
        .join(
            enter => enter.append("rect")
                .attr("fill", "#aaa")
                .attr("height", intron_height)
                .attr("width", 0)
                .attr("x", d => ppml['12px'] * d.beg),
            update => update.transition(t)
                .attr("opacity", "1")
                .attr("width", d => ppml['12px'] * d.len)
                .attr("x", d => ppml['12px'] * d.beg),
            exit => exit.transition(t).remove()
                .attr("opacity", "0")
        ).call(blocks => blocks.transition(t)
               .attr("height", intron_height)
               .attr("width", d => ppml['12px'] * d.len)
               .attr("x", d => ppml['12px'] * d.beg));    
}


function calculateLeftOffset(splice){
    var spliced_out = splice.map(x => x.size).reduce((x,y) => x + y)
    return(Math.floor(ppml['12px'] * spliced_out / 2) + off_col)
}

function renderAll(seq, transcriptome, exons, pos_donors_accpts, splice, spliced_exons,
                   ans)
{    
    var left_off = calculateLeftOffset(transcriptome.splice)
    const show = ans !== rand.akey[0]()
    if (show){
        splice = [{don:null, acc:null, name: null}]
        transcriptome.splice = [{pos:null, seq:null, size:null}]
    }
    ansdiv.style.display = show?"flex":"none";
    renderGenome(seq)
    renderPairings(splice);
    renderDonAcc(pos_donors_accpts);
    renderGenomeExons(exons);
    renderGenomeIntrons(exons);
    renderTranscriptome(transcriptome, left_off);
    renderSpliceJunctions(transcriptome.splice, left_off)
    renderSplicedExons(spliced_exons, left_off)
    renderSplicedIntrons(spliced_exons, left_off);
}
