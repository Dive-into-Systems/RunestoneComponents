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
        this.index_all = ["00", "01", "10", "11"];

        // keep track of the last generated cache combination and ensure
        // each time it generates a different combination
        this.last_rand_choice = [0,0,0];

        this.createCachetableElement();
        this.caption = "Cache Table";
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
    createCachetableElement() {
        this.feedbackDiv = document.createElement("div");
        this.setDefaultParams();
        this.loadParams();
        this.renderCacheTableInput();
        this.renderCacheTableButtons();
        this.renderCacheTableFeedbackDiv();
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
        this.tag_bits = this.num_bits - this.index_bits - this.offset_bits;
        this.num_refs = 8;
    }

    // load customized parameters
    loadParams() {
        try {
            const curr_options = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (curr_options["bits"] != undefined) {
                this.num_bits = eval(curr_options["bits"]);
            }
            if (curr_options["cache-org"] != undefined) {
                this.cache_org = curr_options["cache-org"];
            }
            if (curr_options["offset"] != undefined) {
                this.offset_bits = eval(curr_options["offset"]);
                this.block_size = 1 << this.offset_bits;
            }            
            if (curr_options["index"] != undefined) {
                this.index_bits = eval(curr_options["index"]);
                this.num_rows = 1 << this.index_bits;
            }
            if (curr_options["ref"] != undefined) {
                this.num_refs = eval(curr_options["ref"]);
            }
            this.tag_bits = this.num_bits - this.index_bits - this.offset_bits;
        } catch (error) {
            // pass
            console.log(this.scriptSelector(this.origElem));
            console.log(error);
        }
    }

    createTableInfo() {
        this.tableInfo = document.createElement("table");
        this.tableInfoHead = document.createElement("thead");
        this.tableInfoHeadRow = document.createElement("tr");
        this.tableInfoHeadRow1 = document.createElement("td");
        this.tableInfoHeadRow1.textContent = "Cache Table Info";
        this.tableInfoHeadRow.appendChild(this.tableInfoHeadRow1);
        this.tableInfoHead.appendChild(this.tableInfoHeadRow);
        this.tableInfo.appendChild(this.tableInfoHead);

        this.tableInfoRow1 = document.createElement("tr");
        this.tableInfoCacheOrg = document.createElement("td");
        this.tableInfoCacheOrg.textContent = this.cache_org;
        this.tableInfoRow1.appendChild(this.tableInfoCacheOrg);

        this.tableInfoRow2 = document.createElement("tr");
        this.tableInfoAddressLength = document.createElement("td");
        this.tableInfoAddressLength.textContent = this.num_bits.toString() + "-bit Address";
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
        
        // this.tableInfo.style.float = "left";
        this.tableInfo.setAttribute("width", "25%");
        this.promptDiv.appendChild(this.tableInfo);
    }
    // height: auto; display:flex; flex-direction: row; justify-content:space-between
    // create the cache table to display
    createDisplayedTable() {
        
        this.displayedTable = document.createElement("table");
        this.displayedTable.setAttribute("width", "42%"); 
        // create the head row for the cache table
        this.displayedTableHead = document.createElement("thead");
        this.displayedTableHeadRow = document.createElement("tr");
        this.displayedTableHeadRow0 = document.createElement("th");
        this.displayedTableHeadRow0.style.width = "30%";
        this.displayedTableHeadRow0.textContent = "Index";
        this.displayedTableHeadRowV = document.createElement("th");
        this.displayedTableHeadRowV.style.width = "10%";
        this.displayedTableHeadRowV.textContent = "V";
        this.displayedTableHeadRowD = document.createElement("th");
        this.displayedTableHeadRowD.style.width = "10%";
        this.displayedTableHeadRowD.textContent = "D";
        this.displayedTableHeadRowTag = document.createElement("th");
        this.displayedTableHeadRowTag.style.width = "50%"
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
            tableRow.style.backgroundColor = "white";
            this.displayedTableBody.appendChild(tableRow);
        }
        
        this.displayedTable.appendChild(this.displayedTableBody);
        this.displayedTable.style.float = "right";
        this.displayedTable.style.marginRight = "0px";   
        this.promptDiv.appendChild(this.displayedTable);
    }

    updateDisplayedTableBody() {
        const changed_line = this.answer_list[this.curr_ref-1][1];
        for (let i = 0; i < this.num_rows; i++) {
            this.displayedTableBody.rows[i].cells[1].textContent = this.curr_tagIndex_table[i][0].toString();
            this.displayedTableBody.rows[i].cells[2].textContent = this.curr_tagIndex_table[i][1].toString();
            this.displayedTableBody.rows[i].cells[3].textContent = this.curr_tagIndex_table[i][2];
            if ( i === changed_line ) {
                this.displayedTableBody.rows[i].style.backgroundColor = "yellow";
            } else {
                this.displayedTableBody.rows[i].style.backgroundColor = "white";
            }
        }
    }
    
    renderCacheTableInput() {
        // create the main div
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // create the div for the info table and the displayed cache table
        this.promptDiv = document.createElement("div");
        this.promptDiv.setAttribute("class", "aligned-tables");
        this.promptDiv.style.height = "auto";
        this.createTableInfo();
        this.createDisplayedTable();
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // create the div for the reference table and the answer table
        this.bodyTableDiv = document.createElement("div");
        this.bodyTableDiv.setAttribute("class", "aligned-tables");
        this.createReferenceTable();
        this.createAnswerTable();
        this.containerDiv.appendChild(this.bodyTableDiv);

        // initialize answer generation
        this.generateAnswer_init();

        // generate the first asnwer
        this.generateAnswer_next();

        this.updateReferenceTableAndAnswerTable();
        
        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        // this.generateAddress();
        // this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
    }
    
    createReferenceTable() {
        // 
        this.referenceTable = document.createElement("table");
        // this.referenceTable.style.float = "left";
        // create the head row for the reference table
        this.referenceTableHead = document.createElement("thead");   
        this.referenceTableHead.innerHTML = 
        "<tr>" +
        "<th title=\"Reference Number\">Ref</th>"+
        "<th title=\"Address\">Address</th>"+
        "<th title=\"Read or Write\">R/W</th>"+
        "</tr> ";
        this.referenceTable.appendChild(this.referenceTableHead);  
        
        // create the body for the reference table
        this.referenceTableBody = document.createElement("tbody");
        this.referenceTable.appendChild(this.referenceTableBody);
        
        this.referenceTable.setAttribute("width", "20%");
        this.bodyTableDiv.appendChild(this.referenceTable);

    }

    createAnswerTable() {
        this.answerTable = document.createElement("table");
        this.answerTable.style.float = "right";
        this.answerTable.style.marginRight = "0px";
        // create the head row for the reference table
        this.answerTableHead = document.createElement("thead");   
        this.answerTableHead.innerHTML = 
        "<tr>" +
        "<th title=\"Hit?\" width=\"15%\">Hit?</th>"+
        "<th title=\"Miss?\" width=\"15%\">Miss?</th>"+
        "<th title=\"Index\" width=\"21%\">Index</th>"+
        "<th title=\"Valid Bit\" width=\"7%\">V</th>"+
        "<th title=\"Dirty Bit\" width=\"7%\">D</th>"+
        "<th title=\"Tag Bit\" width=\"35%\">Tag</th>"+
        "</tr> ";
        this.answerTable.appendChild(this.answerTableHead);  
        
        // create the body for the reference table
        this.answerTableBody = document.createElement("tbody");
        this.answerTable.appendChild(this.answerTableBody);
        
        this.answerTable.setAttribute("width", "60%");
        this.bodyTableDiv.appendChild(this.answerTable);
    }

    updateReferenceTableAndAnswerTable() {
        if (this.curr_ref > 0) {
            this.disableAnswerTableCurrentRow();
        }
        this.addReferenceTableNewRow();
        this.addAnswerTableNewRow();
    }

    // disable all the input fields of the previous row
    disableAnswerTableCurrentRow() {
        const last_ref = this.curr_ref - 1;
        for ( var old_cell of this.answerTableBody.rows[ last_ref ].cells ) {
            for ( var field of old_cell.children ) {
                field.setAttribute("readonly", "readonly");
                field.setAttribute("disabled", "disabled");
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

        const curr_RW = this.read_write_list[curr_ref] ? "W" : "R";
        var cellCurrRW = document.createElement("td");
        cellCurrRW.textContent = curr_RW;
        referenceTableNewRow.appendChild(cellCurrRW);

        this.referenceTableBody.appendChild(referenceTableNewRow);
    }

    addAnswerTableNewRow() {
        var answerTableNewRow = document.createElement("tr");
        
        // generate prompt side
        const curr_ref = this.curr_ref.toString(); // current reference number
        // generate input side
        // generate radio for Hit and Miss
        var cellHit = document.createElement("td");
        var cellHitBox = document.createElement("input");
        cellHitBox.setAttribute("type", "radio");
        cellHitBox.setAttribute("value", "H");
        cellHitBox.setAttribute("name", "HM" + curr_ref);
        cellHitBox.setAttribute("id", "Hit" + curr_ref);
        cellHit.appendChild(cellHitBox);
        answerTableNewRow.appendChild(cellHit);
        
        var cellMiss = document.createElement("td");
        var cellMissBox = document.createElement("input");
        cellMissBox.setAttribute("type", "radio");
        cellMissBox.setAttribute("name", "HM" + curr_ref);
        cellMissBox.setAttribute("value", "M");
        cellMissBox.setAttribute("id", "Miss" + curr_ref);
        cellMiss.appendChild(cellMissBox);
        answerTableNewRow.appendChild(cellMiss);

        // generate normal input fields
        var cellInputIndexBox = document.createElement("input");
        cellInputIndexBox.setAttribute("maxlength", "5");
        cellInputIndexBox.setAttribute("size", "5");
        cellInputIndexBox.setAttribute("type", "text");
        cellInputIndexBox.setAttribute("name", "Index" + curr_ref);
        var cellInputIndex = document.createElement("td");
        cellInputIndex.appendChild(cellInputIndexBox);
        answerTableNewRow.appendChild(cellInputIndex);

        var cellInputValidBox = document.createElement("input");
        cellInputValidBox.setAttribute("maxlength", "1");
        cellInputValidBox.setAttribute("size", "1");
        cellInputValidBox.setAttribute("type", "text");
        cellInputValidBox.setAttribute("name", "Valid" + curr_ref);
        var cellInputValid = document.createElement("td");
        cellInputValid.appendChild(cellInputValidBox);
        answerTableNewRow.appendChild(cellInputValid);

        var cellInputDirtyBox = document.createElement("input");
        cellInputDirtyBox.setAttribute("maxlength", "1");
        cellInputDirtyBox.setAttribute("size", "1");
        cellInputDirtyBox.setAttribute("type", "text");
        cellInputDirtyBox.setAttribute("name", "Dirty" + curr_ref);
        var cellInputDirty = document.createElement("td");
        cellInputDirty.appendChild(cellInputDirtyBox);
        answerTableNewRow.appendChild(cellInputDirty);

        var cellInputTagBox = document.createElement("input");
        cellInputTagBox.setAttribute("maxlength", "16");
        cellInputTagBox.setAttribute("size", "8");
        cellInputTagBox.setAttribute("type", "text");
        cellInputTagBox.setAttribute("name", "Tag" + curr_ref);
        var cellInputTag = document.createElement("td");
        cellInputTag.appendChild(cellInputTagBox);
        answerTableNewRow.appendChild(cellInputTag);

        this.answerTableBody.appendChild(answerTableNewRow);
    }
    
    recordAnswered() {
        // this.answer = true;
        // this.response_list = [];
        // for ( var i = 3 ; i < 10; i ++ ) {
        //     let this_cell = this.referenceTableBody.rows[ this.curr_ref ].cells[ i ];
        //     for ( var field of old_cell.children ) {
        //         this.response_list.push(this.response_list);
        //     }
        // }

        // curr_answer = this.answer_list[this.answer_list.length - 1];
        
        // TODO: further with check answer
    }

    renderCacheTableButtons() {
        // "check me" button and "generate a number" button
        this.buttonDiv = document.createElement("div");
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
                if (this.curr_ref != this.num_refs ) {
                    this.checkCurrentAnswer();
                    this.logCurrentAnswer();
                    if (this.correct) {
                        this.curr_ref += 1;
                        if (this.curr_ref < this.num_refs) {
                            // TODO: call next
                            this.updateDisplayedTableBody()
                            this.generateAnswer_next();
                            this.updateReferenceTableAndAnswerTable();
                        } else {
                            // TODO: render feedback that congrats and this is all of the question
                            this.disableAnswerTableCurrentRow();
                        }
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
                // TODO: redo the question
            }.bind(this),
            false)
        ;
        // put all buttons together
        this.buttonDiv.appendChild(document.createElement("br"));
        this.buttonDiv.appendChild(this.generateButton);
        this.buttonDiv.appendChild(this.submitButton);
        this.buttonDiv.setAttribute("width", "100%");
        this.containerDiv.appendChild(this.buttonDiv);
    }
    
    renderCacheTableFeedbackDiv() {
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
        console.log(tagIndex);
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
        let valid_tagIndex_list = []; // TODO: see whether there is a bug here
        for (var j = 0; j < this.curr_tagIndex_table.length; j++) { // collect all current valid tagIndices
            if (this.curr_tagIndex_table[j][0] == 1) {
                valid_tagIndex_list.push(this.curr_tagIndex_table[j][2] + this.toBinary(j, this.index_bits));
            }
        }
        console.log(valid_tagIndex_list)
        if (curr_hm) {
            // if it is a hit, pick a valid tagIndex to proceed
            let currRand = Math.floor(Math.random() * valid_tagIndex_list.length);
            currtagIndex = valid_tagIndex_list[currRand];
        } else {
            // if it is a miss, then generate a new tagIndex
            currtagIndex = this.generateTagIndex();
            console.log(valid_tagIndex_list[0] in valid_tagIndex_list);
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

    // Convert an integer to its binary expression with leading zeros as a string.
    // The string always has length of len
    toBinary(num, len) {
        var str = num.toString(2);
        if (str.length < len) {
            var leading_zeros = "";
            for ( var i = str.length ; i < len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
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
        this.correct = true;
        const curr_ref = this.curr_ref;
        try {
            const response_hit_miss = 
                document.querySelector('input[name="HM' + curr_ref.toString() + '"]:checked').value === "H" ? true : false;
            const response_index =
                document.querySelector('input[name="Index' + curr_ref.toString() + '"]').value;
            const response_dirty =
                document.querySelector('input[name="Dirty' + curr_ref.toString() + '"]').value;
            const response_valid =
                document.querySelector('input[name="Valid' + curr_ref.toString() + '"]').value;
            const response_tag =
                document.querySelector('input[name="Tag' + curr_ref.toString() + '"]').value;
            const curr_answers = this.answer_list[ curr_ref ];
            // console.log(curr_answers);
            // console.log(response_hit_miss);
            // console.log(response_index);
            // console.log(response_dirty);
            // console.log(response_valid);
            // console.log(response_tag);
            
            if ( this.hit_miss_list[ curr_ref ] != response_hit_miss  ) {
                this.correct = false;
            }
            if ( curr_answers[ 1 ].toString() != response_index ) {
                this.correct = false;
            }
            if ( response_valid != "1" ) {
                this.correct = false;
            }
            if ( curr_answers[ 2 ].toString() != response_dirty ) {
                this.correct = false;
            }
            if ( curr_answers[ 3 ].toString() != response_tag ) {
                this.correct = false;
            }            
        } catch (error) {
            this.correct = false;
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
