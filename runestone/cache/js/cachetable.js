// *********
// cachetable.js
// *********
// This file contains the JS for the Runestone cachetable component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./cache-i18n.en.js";
import "../css/cache.css";
import { Pass } from "codemirror";

export var cachetableList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.

// cachetable constructor
export default class cachetable extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // parameters by default

        // keep track of the last generated cache combination and ensure
        // each time it generates a different combination
        this.last_rand_choice = [0,0,0];

        this.createcachetableElement();
        this.caption = "Cache Partition";
        this.addCaption("runestone");
        // this.checkServer("cachetable", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   functions generating final HTML   ====
    ===========================================*/
    createcachetableElement() {
        this.feedbackDiv = document.createElement("div");
        this.setDefaultParams();
        this.rendercachetableInput();
        this.rendercachetableButtons();
        this.rendercachetablefeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        
    }

    setDefaultParams() {
        this.cache_org = "Direct-Mapped";
        this.num_bits = 8;
        this.offset_bits = 2;
        this.block_size = 1 << this.offset_bits;
        this.index_bits = 2;
        this.num_rows = 1 << this.index_bits;
        this.num_refs = 8;
    }

    createTableInfo() {
        this.tableInfo = document.createElement("table");

        this.tableInfoRow1 = document.createElement("tr");
        this.tableInfoCacheOrg = document.createElement("td");
        this.tableInfoCacheOrg.textContent = this.cache_org;
        this.tableInfoRow1.appendChild(this.tableInfoCacheOrg);

        this.tableInfoRow2 = document.createElement("tr");
        this.tableInfoAddressLength = document.createElement("td");
        this.tableInfoAddressLength.textContent = this.num_bits.toString() + "bit Address";
        this.tableInfoRow2.appendChild(this.tableInfoAddressLength);
        
        this.tableInfoRow3 = document.createElement("tr");
        this.tableInfoBlockSize = document.createElement("td");
        this.tableInfoBlockSize.textContent = "Block Size : " + this.block_size.toString();
        this.tableInfoRow3.appendChild(this.tableInfoBlockSize);
        
        this.tableInfoRow4 = document.createElement("tr");
        this.tableInfoNumRows = document.createElement("td");
        this.tableInfoNumRows.textContent = "Number of rows : " + this.num_rows;
        this.tableInfoRow4.appendChild(this.tableInfoNumRows);
                
        this.tableInfo.appendChild(this.tableInfoRow1);
        this.tableInfo.appendChild(this.tableInfoRow2);
        this.tableInfo.appendChild(this.tableInfoRow3);
        this.tableInfo.appendChild(this.tableInfoRow4);
        
        this.tableInfo.style.float = "left";
        this.containerDiv.appendChild(this.tableInfo);
    }
    
    // create the cache table to display
    createDisplayedTable() {
        
        this.displayedTable = document.createElement("table");
        // create the head row for the cache table
        this.displayedTableHead = document.createElement("thead");
        this.displayedTableHeadRow = document.createElement("tr");
        this.displayedTableHeadRow0 = document.createElement("th");
        this.displayedTableHeadRow0.textContent = "Index";
        this.displayedTableHeadRowV = document.createElement("th");
        this.displayedTableHeadRowV.textContent = "V";
        this.displayedTableHeadRowD = document.createElement("th");
        this.displayedTableHeadRowD.textContent = "D";
        this.displayedTableHeadRowTag = document.createElement("th");
        this.displayedTableHeadRowTag.textContent = "Tag";
        this.displayedTableHeadRow.appendChild(this.displayedTableHeadRow0);
        this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowV);
        this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowD);
        this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowTag);
        this.displayedTableHead.appendChild(this.displayedTableHeadRow);
        this.displayedTable.appendChild(this.displayedTableHead);     
        
        // create the body for the cache table
        this.displayedTableBody = document.createElement("tbody");
        this.displayedTableBodyRows = [];
        var tableRow, line, valid_bit, dirty_bit, tag_field;
        for ( var i = 0 ; i < this.num_rows ; i ++ ) {
            tableRow = document.createElement("tr");
            line = document.createElement("td");
            line.textContent = i.toString();
            valid_bit = document.createElement("td");
            valid_bit.textContent = "0"
            dirty_bit = document.createElement("td");
            dirty_bit.textContent = "0"
            tag_field = document.createElement("td");
            let currRand = Math.random();
            if (currRand < 0.33) {
                tag_field.textContent = this.generateTagIndex() + this.generateOffset();    
            }
            tableRow.appendChild(line);
            tableRow.appendChild(valid_bit);
            tableRow.appendChild(dirty_bit);
            tableRow.appendChild(tag_field);
            // let oneRow = [valid_bit, dirty_bit, tag_field]
            // this.displayedTableBodyRows.push(tableRow);
            this.displayedTableBody.appendChild(tableRow);
        }
        
        this.displayedTable.appendChild(this.displayedTableBody);
        this.displayedTable.style.float = "right";
        this.containerDiv.appendChild(this.displayedTable);
    }

    updateDisplayedTableBody() {
        for (let i = 0; i < this.num_rows; i++) {
            this.displayedTableBody.rows[i].cells[1].textContent = this.curr_tagIndex_table[i][0].toString();
            this.displayedTableBody.rows[i].cells[2].textContent = this.curr_tagIndex_table[i][1].toString();
            this.displayedTableBody.rows[i].cells[3].textContent = this.curr_tagIndex_table[i][2];
        }
    }
    
    rendercachetableInput() {
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        // this.questionDiv = document.createElement("div");
        this.containerDiv.id = this.divid;
        
        this.createTableInfo();
        this.createDisplayedTable();
        this.containerDiv.appendChild(document.createElement("br"));

        this.createReferenceTable();

        this.generateAnswer_init();
        this.generateAnswer_next();
        this.updateReferenceTable();
        
        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        // this.generateAddress();
        // this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find("input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        ba.attr("type", "text");
        ba.attr("size", "10");
        ba.attr("maxlength", "10");
        ba.attr("placeholder", "your answer");
        
        this.blankArray = ba.toArray();
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }
    
    createReferenceTable() {
        // 
        this.referenceTable = document.createElement("table");
        // create the head row for the reference table
        this.referenceTableHead = document.createElement("thead");   
        this.referenceTableHead.innerHTML = 
        "<tr>" 
        "<th title=\"Reference Number\">Ref</th>"+
        "<th title=\"Address\">Address</th>"+
        "<th title=\"Read or Write\">R/W</th>"+
        "<th title=\"Hit?\">H</th>"+
        "<th title=\"Missed?\">M</th>"+
        "<th title=\"Any Changes?\">C</th>"+
        "<th title=\"Index\">Index</th>"+
        "<th title=\"Valid Bit\">V</th>"+
        "<th title=\"Dirty Bit\">D</th>"+
        "<th title=\"Tag Bit\">Tag</th>"+
        "</tr> ";
        this.referenceTable.appendChild(this.referenceTableHead);  
        
        // create the body for the reference table
        this.referenceTableBody = document.createElement("tbody");
        this.referenceTable.appendChild(this.referenceTableBody);
        
        this.containerDiv.appendChild(this.referenceTable);
    }

    updateReferenceTable() {
        if (this.curr_ref > 0) {
            this.disableReferenceTableCurrentRow();
        }
        this.addReferenceTableNewRow();
    }

    // disable all the input fields of the previous row
    disableReferenceTableCurrentRow() {
        const last_ref = this.curr_ref - 1;
        for ( var i = 3 ; i < 10; i ++ ) {
            let old_cell = this.referenceTableBody.rows[ last_ref ].cells[ i ];
            for ( var field of old_cell.children ) {
                field.setAttribute("readonly", "readonly");
            }
        }
    } 

    addReferenceTableNewRow() {
        // create new row element
        var referenceTableNewRow = document.createElement("tr");
        
        // generate prompt side
        const curr_ref = this.curr_ref.toString(); // current reference number
        var cellCurrRef = document.createElement("td");
        cellCurrRef.textContent = curr_ref;
        referenceTableNewRow.appendChild(cellCurrRef);

        const curr_address = this.answer_list[curr_ref][0];
        var cellCurrAddr = document.createElement("td");
        cellCurrAddr.textContent = curr_address;
        referenceTableNewRow.appendChild(cellCurrAddr);

        const curr_RW = this.read_write_list ? "W" : "R";
        var cellCurrRW = document.createElement("td");
        cellCurrRW.textContent = curr_RW;
        referenceTableNewRow.appendChild(cellCurrRW);
        
        // generate input side
        // generate radio for Hit and Miss
        var cellHit = document.createElement("td");
        var cellHitBox = document.createElement("input");
        cellHitBox.setAttribute("type", "radio");
        cellHitBox.setAttribute("value", "H");
        cellHitBox.setAttribute("name", "HM" + curr_ref);
        cellHitBox.setAttribute("id", "Hit" + curr_ref);
        cellHit.appendChild(cellHitBox);
        referenceTableNewRow.appendChild(cellHit);
        
        var cellMiss = document.createElement("td");
        var cellMissBox = document.createElement("input");
        cellMissBox.setAttribute("type", "radio");
        cellMissBox.setAttribute("name", "HM" + curr_ref);
        cellMissBox.setAttribute("value", "M");
        cellMissBox.setAttribute("id", "Miss" + curr_ref);
        cellMiss.appendChild(cellMissBox);
        referenceTableNewRow.appendChild(cellMiss);

        // generate multiple choice for Changed
        var cellChanged = document.createElement("td");
        var cellChangedBox = document.createElement("input");
        cellChangedBox.setAttribute("type", "checkbox");
        cellChangedBox.setAttribute("id", "Changed" + curr_ref);
        cellChanged.appendChild(cellChangedBox);
        referenceTableNewRow.appendChild(cellChanged);

        // generate normal input fields
        var cellInputIndexBox = document.createElement("input");
        cellInputIndexBox.setAttribute("maxlength", "5");
        cellInputIndexBox.setAttribute("size", "5");
        cellInputIndexBox.setAttribute("type", "text");
        cellInputIndexBox.setAttribute("id", "Index" + curr_ref);
        var cellInputIndex = document.createElement("td");
        cellInputIndex.appendChild(cellInputIndexBox);
        referenceTableNewRow.appendChild(cellInputIndex);

        var cellInputValidBox = document.createElement("input");
        cellInputValidBox.setAttribute("maxlength", "1");
        cellInputValidBox.setAttribute("size", "5");
        cellInputValidBox.setAttribute("type", "text");
        cellInputValidBox.setAttribute("id", "Valid" + curr_ref);
        var cellInputValid = document.createElement("td");
        cellInputValid.appendChild(cellInputValidBox);
        referenceTableNewRow.appendChild(cellInputValid);

        var cellInputDirtyBox = document.createElement("input");
        cellInputDirtyBox.setAttribute("maxlength", "1");
        cellInputDirtyBox.setAttribute("size", "5");
        cellInputDirtyBox.setAttribute("type", "text");
        cellInputDirtyBox.setAttribute("id", "Dirty" + curr_ref);
        var cellInputDirty = document.createElement("td");
        cellInputDirty.appendChild(cellInputDirtyBox);
        referenceTableNewRow.appendChild(cellInputDirty);

        var cellInputTagBox = document.createElement("input");
        cellInputTagBox.setAttribute("maxlength", "16");
        cellInputTagBox.setAttribute("size", "12");
        cellInputTagBox.setAttribute("type", "text");
        cellInputTagBox.setAttribute("id", "Tag" + curr_ref);
        var cellInputTag = document.createElement("td");
        cellInputTag.appendChild(cellInputTagBox);
        referenceTableNewRow.appendChild(cellInputTag);

        this.referenceTableBody.appendChild(referenceTableNewRow);
    }
    
    recordAnswered() {
        // this.answer = true;
        this.response_list = [];
        for ( var i = 3 ; i < 10; i ++ ) {
            let this_cell = this.referenceTableBody.rows[ this.curr_ref ].cells[ i ];
            for ( var field of old_cell.children ) {
                this.response_list.push(this.response_list);
            }
        }

        curr_answer = this.answer_list[this.answer_list.length - 1];
        
        // TODO: further with check answer
    }

    rendercachetableButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_cachetable_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "check and next",
            type: "button",
        });
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkCurrentAnswer();
                this.logCurrentAnswer();
                if (this.correct) {
                    this.curr_ref += 1;
                    if (this.curr_ref < this.num_refs) {
                        // TODO: call next
                        this.generateAnswer_next();
                        this.updateReferenceTable();
                    } else {
                        // TODO: render feedback that congrats and this is all of the question
                    }
                }
            }.bind(this),
            false
        );
        
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_cachetable_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate Another",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                // TODO: reset the question
            }.bind(this),
            false)
        ;
        // put all buttons together
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }
    
    rendercachetablefeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // generate a random memory address
    generateTagIndex() {
        var tagIndex = "";
        for (let i = 0; i < (this.tag_bits + this.index_bits); i++) {
            let currRand = Math.random();
            if (currRand < 0.5) {
                tagIndex += "0";
            } else {
                tagIndex += "1";
            }
        }
        return tagIndex;
    }

    generateOffset() {
        var offset = "";
        for (let i = 0; i < (this.offset_bits); i++) {
            let currRand = Math.random();
            if (currRand < 0.5) {
                offset += "0";
            } else {
                offset += "1";
            }
        }
        return offset;
    }

    generateAnswer_init() {
        // initialize current reference number (int)
        this.curr_ref = 0;

        // generate hit miss (bool): hit = true; miss = false
        this.hit_miss_list = [];

        // generate read write list (bool): write = true; read = false
        this.read_write_list = [];
        
        // this table keeps track of [valid bit (int 0/1), dirty bit (int 0/1), tag (str)] with index meaning line number
        // Remark: this table size is fixed
        this.curr_tagIndex_table = [];
        for (let i = 0; i < this.num_rows; i++) {
            this.curr_tagIndex_table.push([0,0,""]);
        }
        
        // this list keeps track of the answer in terms of [line# (int), dirty bit (int 0/1), tag (str)]
        // Remark: this list size grows as there is growing number of steps
        this.answer_list = [];
    }

    generateAnswer_next() {
        // determine the hit/ miss answer for this step
        var curr_hm; // hit = true; miss = false
        if (this.curr_ref == 0) { // first always a miss
            curr_hm = false;
        } else if (this.curr_ref == 1) { // second half half
            let currRand = Math.random();
            if (currRand < 0.5) {
                curr_hm = false;
            } else {
                curr_hm = true;                
            }
        } else {
            // if previous two hits, miss this time
            if (this.hit_miss_list[this.curr_ref - 2] && this.hit_miss_list[this.curr_ref - 1]) {
                curr_hm = false;
            } else { // otherwise half half
                let currRand = Math.random();
                if (currRand < 0.5) {
                    curr_hm = false;
                } else {
                    curr_hm = true;                    
                }
            }
        }
        this.hit_miss_list.push(curr_hm);
        
        // determine the read/ write for this step - always half half
        var curr_rw; // write = true; read = false
        let currRand = Math.random();
        if (currRand < 0.5) {
            curr_rw = false;
        } else {
            curr_rw = true;    
        }
        this.read_write_list.push(curr_rw);
        
        
        // generate current tagIndex
        var currtagIndex;
        let valid_tagIndex_list = [];
        for (var j = 0; j < 4; j++) { // collect all current valid tagIndices
            if (this.curr_tagIndex_table[j][0] == 1) {
                valid_tagIndex_list.push(this.curr_tagIndex_table[j][1])
            }
        }
        if (curr_hm) {
            // if it is a hit, pick a valid tagIndex to proceed
            let currRand = Math.floor(Math.random() * valid_tagIndex_list.length);
            currtagIndex = valid_tagIndex_list[currRand];
        } else {
            // if it is a miss, then generate a new tagIndex
            currtagIndex = this.generateTagIndex();
            while (currtagIndex in valid_tagIndex_list) {
                currtagIndex = this.generateTagIndex();
            }
        }
        var curr_tag_b = currtagIndex.slice(0, this.tag_bits);
        var curr_idx_b = currtagIndex.slice(-this.index_bits);
        var curr_idx_d = this.binary2decimal(curr_idx_b);
        var curr_address = currtagIndex + this.generateOffset();

        // generate current dirty bit
        var curr_d = this.calculateDirtyBit(curr_rw, curr_hm, this.curr_tagIndex_table[curr_idx_d][1]);
        
        // reflect the changes in answer_list and curr_tagIndex_table
        this.answer_list.push([curr_address, curr_idx_d, curr_d, curr_tag_b]);
        this.curr_tagIndex_table[curr_idx_d][0] = 1; // change valid bit to 1
        this.curr_tagIndex_table[curr_idx_d][1] = curr_d; // change dirty bit to corresponding value
        this.curr_tagIndex_table[curr_idx_d][2] = curr_tag_b; // change tag to corresponding string
    }

    calculateDirtyBit(isWrite, isHit, PrevDirtyBit) {
        if (isWrite) { // if it is a write request, always set dirty bit to 1
            return 1;
        } else { // if it is a read request
            if (isHit) { // then if it is a hit, match current dirty bit state to that of the previous content
                if (PrevDirtyBit == 1) {
                    return 1;
                } else {
                    return 0;
                }
            } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
                return 0;
            }
        }
    }

    binary2decimal(binary) {
        var ans = 0;
        for (let i = 0; i < binary.length; i++) {
            if (binary[i] == "1") {
                ans = ans*2 + 1;
            } else {
                ans *= 2;
            }
        }
        return ans;
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if each of the input field is the same as its corresponding value in this.answers
        this.correct = true
        for (let i = 0; i < this.tag_bits; i++) {
            if (this.address_node_list[i].className != "tagclass") {
                this.correct = false;
                return;
            }
        }
        for (let i = this.tag_bits; i < (this.tag_bits + this.index_bits); i++) {
            if (this.address_node_list[i].className != "indexclass") {
                this.correct = false;
                return;
            }
        }
        for (let i = (this.tag_bits + this.index_bits); i < this.num_bits; i++) {
            if (this.address_node_list[i].className != "offsetclass") {
                this.correct = false;
                return;
            }
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "cachetable",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        this.renderfeedback();
        return data;
    }

    /**
     * Calculates and display the number of bits for tag index and offset correspondingly
     */
    currInputBits() {
        this.input_tag_bits = 0;
        this.input_index_bits = 0;
        this.input_offset_bits = 0;
        for (let i = 0; i < this.num_bits; i++) {
            if (this.address_node_list[i].className == "tagclass") {
                this.input_tag_bits += 1;
            } else if (this.address_node_list[i].className == "indexclass") {
                this.input_index_bits += 1;
            } else if (this.address_node_list[i].className == "offsetclass") {
                this.input_offset_bits += 1;
            }
        }
        this.input_tag_count.textContent = this.input_tag_bits.toString();
        this.input_index_count.textContent = this.input_index_bits.toString();
        this.input_offset_count.textContent = this.input_offset_bits.toString();
    }

    // update the prompt
    // generatePrompt() {
    //     this.updateDisplayedAddress();
    //     this.blockNodeBlock.textContent = this.block_size_ans;
    //     this.lineNodeLine.textContent = this.num_line_ans;
    // }

    hidefeedback() {
        this.feedbackDiv.style.visibility = "hidden";
    }

    displayfeedback() {
        this.feedbackDiv.style.visibility = "visible";
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";

        if (this.correct) {
            feedback_html += "<div>" + $.i18n("msg_cachetable_correct") + "</div>";
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            feedback_html += "<div>" + $.i18n("msg_cachetable_incorrect") + "</div>";
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.displayfeedback();
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=cachetable]").each(function (index) { 
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                cachetableList[this.id] = new cachetable(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
