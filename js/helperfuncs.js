
/** Produce all the indices of searchStr in str **/
function getIndicesOf(searchStr, str) {
    var searchStrLen = searchStr.length;
    var startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

/** Split string at index **/
function splitAtIndex(str, index) {
    return([str.slice(0, index), str.slice(index)])
}


/** Return all combinations of arr1 on arr2, where an element in arr1 < arr2 **/
function prepareCartesian(arr1 = [], arr2 = []){
    const res = [];
    for (let i = 0; i < arr1.length; i++){
       for (let j = 0; j < arr2.length; j++){
           let x = arr1[i], y = arr2[j];
           if (x < y){
               res.push([x,y])
           }
       }
    };
    return res;
};

/** Generate a list of non-overlapping Donor-Acceptor splice sites **/
function makeSplicePairings(all_possible_pairs, min_dist=5)
{
    var select_a_few = all_possible_pairs.filter((x, i) => (100 * splrand()) > 50)

    // Determine consistency in those that remain.
    var spl_map={}, valid_few = []
    for (var s=0; s < select_a_few.length; s++){
        var sta = select_a_few[s][0],
            end = select_a_few[s][1];

        if (sta in spl_map){ continue }
        if (end in spl_map){ continue }

        spl_map[sta] = true
        spl_map[end] = true

        // We have a valid unique splice pairing
        // - Check whether it overlaps any other pairing
        //   in the current list
        var overlaps=false
        for (var v=0; v < valid_few.length; v++){
            var vend = valid_few[v].acc + min_dist;
            //vsta = valid_few[v].don,

            if (sta < vend){
                overlaps = true
                break
            }
        }
        if (overlaps){ continue; }
        valid_few.push({don:sta, acc:end})
    }
    return (valid_few)
}

/** Generate an acceptable number of non-overlapping Donor-Acceptor splice sites, and give
 * them unique names. **/
function makeValidSplicePairings(all_possible_pairs, named_sites, min=2, max=5){
    var max_loops = 1000
    var num_pairings = 0
    var spees;
    while ((--max_loops > 0) && (num_pairings < min) || (num_pairings > max)){
        spees = makeSplicePairings(all_possible_pairs)
        num_pairings = spees.length;
    }
    // Give names to the junctions (donor location, and site names)
    for (var i=0; i < spees.length; i++){
        let sj = spees[i];
        sj.name = sj.don + "-" + (sj.acc+2)
        let dname = named_sites.filter(x => x.val === sj.don),
            aname = named_sites.filter(x => x.val === sj.acc);

        if ((dname.length !== 1) || (aname.length !==1)){
            console.log("Ambiguous names:", sj)
        }
        sj.sites = dname[0].name + "-" + aname[0].name
    }    
    return(spees)
}

function nameSites(donors, acceptors){
    // Highlight Donors and Acceptors
    let don_acc = donors.map((x,i) => {return({val:x, name: "D"+i, fill: "red" })})
    let acc_arr = acceptors.map((x,i) => {return({val:x, name: "A"+i, fill: "blue" })});
    don_acc.push.apply(don_acc, acc_arr);
    return(don_acc)
}


/** Check if a D3 group is empty, if so add it. **/
function primeGroup(name, trans_offsets, update_always=false){
    function transform(d){
        let x = trans_offsets.x,
            y = trans_offsets.y;
        return(`translate(${x},${y})`);
    }    
    var new_group = d3.select("#" + name)
    
    if (new_group.empty()){
        new_group = svg_group.append("g").attr("id", name)
            .attr("transform", transform)
    } else if (update_always) {
        new_group.transition(t).attr("transform", transform())
    }
    return (new_group)
}