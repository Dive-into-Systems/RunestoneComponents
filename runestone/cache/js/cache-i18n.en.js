$.i18n().load({
    en: {
        cache_org: "cache organization",
        block_size: "block size",
        num_rows: "number of rows",
        num_lines: "number of lines",
        msg_no_answer: "No answer provided.",
        msg_cacheinfo_check_me: "Check me",
        msg_cacheinfo_compare_me: "Compare me",
        msg_cacheinfo_generate_a_number: "Generate a number",
        msg_cacheinfo_incorrect:             
            ["Incorrect. Hint: block size has something to do with the offset bits", 
            "Incorrect. Hint: number of rows has something to do with the index bits",
            "Incorrect. Hint: number of lines has something to do with the index bits and setassociatives"],
        msg_cacheinfo_correct: "Correct. Good job!",
        msg_cacheinfo_not_divisible_by_4: "Error: number of bits should be multiple of 4",
        msg_cacheinfo_too_many_bits: "Error: too many number of bits",
    },
});
