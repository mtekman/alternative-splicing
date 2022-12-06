
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
function makeSplicePairings()
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
            var vsta = valid_few[v].don,
                vend = valid_few[v].acc;

            if (sta < vend){
                overlaps = true
                break
            }
        }
        if (overlaps){ continue; }
        valid_few.push({don:select_a_few[s][0], acc:select_a_few[s][1]})
    }
    return (valid_few)
}

/** Generate an acceptable number of non-overlapping Donor-Acceptor splice sites, and give
 * them unique names. **/
function makeValidSplicePairings(min=2, max=5){
    var max_loops = 1000
    var num_pairings = 0
    var spees;
    while ((--max_loops > 0) && (num_pairings < min) || (num_pairings > max)){
        spees = makeSplicePairings()
        num_pairings = spees.length;
    }
    spees.map(x=> x.name = x.don+ "-" +x.acc)
    console.log("Found after: ", 1001-max_loops, " loops")
    return(spees)
}
