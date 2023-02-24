// Borrows from generate.js and determine.js

/** Perform the simulation seeded by the splice key, reference key, and genome length **/
function calc_simulation(spl_val, ref_val, gen_len){
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
        spliced_exons = null,
        verdicts = null;
    if (splice_junctions.length > 0){
        transcriptome = determineTranscriptome(genome, splice_junctions);
        splice_info = determineSplicedExons(exons, splice_junctions)
        spliced_exons = splice_info.spliced_exons
        verdicts = splice_info.verdicts
    }

    return({
        genome: genome, transcriptome: transcriptome, exons: exons,
        splice_sites: splice_sites, splice_junctions : splice_junctions,
        spliced_exons: spliced_exons, verdicts: verdicts
    })
}
