var splrand; // random splice generator for a given seed
var refrand; // random ref generator for a given seed

var rand = {

    /** Generates a seed from a key **/
    _cyrb128: function(str) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
    },

    /** Generates a random distribution from 4 seeds **/
    _sfc32: function (a, b, c, d) {
        return function() {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
            var t = (a + b) | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    },

    setseed: function (seedkey){
        if (seedkey === "random"){
            return(Math.random)
        } else {
            let seed = rand._cyrb128(seedkey);
            var randfnc = rand._sfc32(seed[0], seed[1], seed[2], seed[3]);
            return(randfnc)
        }
    },

    // Get nearest index of a string
    _nearestIndex: function (arr, query){
        if (query.length === 0){return -1}
        var match = arr.indexOf(query)
        if (match !== -1){
            return match
        }
        // Do iterative search by expanding the character window.
        var left_index = word_map[query[0]] || 0,
            right_index = word_map[String.fromCharCode(query[0].charCodeAt(0) + 1)] - 1 || arr.length;
        var i= left_index;
        for (; i <= right_index; i++){
            if ((query > arr[i]) === false){
                break
            }
        }
        return(i)
    },

    // Returns the answer key for a given ref and spl
    akey: function(ref,spl){
        ref = ref || refkey.value
        spl = spl || splkey.value
        var lenwords = ref.length + spl.length
        return(wordList[
            ([ref, spl].reduce(
                (acc,val) => acc * rand._nearestIndex(wordList, val), 1
            ) + lenwords) % wordList.length])
    }
}

