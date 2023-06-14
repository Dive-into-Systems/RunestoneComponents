// *********
// cachetable.js
// *********
// This file contains the JS for the Runestone cachetable component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/09/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./cache-i18n.en.js";
import "../css/cache.css";
import { Pass } from "codemirror";

export var cachetableList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.

const direct_mapped = "Direct-Mapped";
const two_way_set_associative = "2-Way Set Associative";
// cachetable constructor
export default class cachetable extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

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

        // initialize parameters
        this.initParams();

        this.renderCacheTableMain();
        this.resetGeneration();
        this.renderCacheTableButtons();
        this.renderCacheTableFeedbackDiv();

        // render the layout for the tables
        this.renderLayout();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.setDefaultParams();
        this.loadParams();
    }

    setDefaultParams() {
        this.cache_org = direct_mapped; 
        //this.cache_org = "2-Way Set Associative"
        this.num_bits = 8;
        this.offset_bits = 2;
        this.block_size = 1 << this.offset_bits;
        this.index_bits = 2;
        this.num_rows = 1 << this.index_bits;
        this.tag_bits = this.num_bits - this.index_bits - this.offset_bits;
        this.num_refs = 8;

        this.init_valid_rate = 0.3;
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
            if (curr_options["init-valid-rate"] != undefined) {
                this.init_valid_rate = eval(curr_options["init-valid-rate"]);
            }
            this.tag_bits = this.num_bits - this.index_bits - this.offset_bits;
        } catch (error) {
            // pass
        }
    }

    renderCacheTableMain() {
        // create the main div
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // create the div for the info table and the displayed cache table
        this.promptDiv = document.createElement("div");
        this.promptDiv.setAttribute("class", "aligned-tables");
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
        
        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
    }

    // create the table that displays the necessary information for the cache exercise
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
        
        this.promptDiv.appendChild(this.tableInfo);
    }
    // height: auto; display:flex; flex-direction: row; justify-content:space-between
    // create the cache table to display
    createDisplayedTable() {
        this.displayedTable = document.createElement("table");
        // create the head row for the cache table
        this.displayedTableHead = document.createElement("thead");
        this.displayedTableHeadRow = document.createElement("tr");
        this.displayedTableHeadRow0 = document.createElement("th");
        this.displayedTableHeadRow0.textContent = "Index";
        
        this.displayedTableHeadRow.appendChild(this.displayedTableHeadRow0);

        if (this.cache_org === direct_mapped) {
            this.displayedTableHeadRowV = document.createElement("th");
            this.displayedTableHeadRowV.textContent = "V";
            this.displayedTableHeadRowD = document.createElement("th");
            this.displayedTableHeadRowD.textContent = "D";
            this.displayedTableHeadRowTag = document.createElement("th");
            this.displayedTableHeadRowTag.textContent = "Tag";
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowV);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowD);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowTag);
   
        } else { // if it is 2-way set associative
            this.displayedTableHeadRowLRU = document.createElement("th");
            this.displayedTableHeadRowLRU.textContent = "LRU";
            this.displayedTableHeadRowV1 = document.createElement("th");
            this.displayedTableHeadRowV1.textContent = "V";
            this.displayedTableHeadRowD1 = document.createElement("th");
            this.displayedTableHeadRowD1.textContent = "D";
            this.displayedTableHeadRowTag1 = document.createElement("th");
            this.displayedTableHeadRowTag1.textContent = "Tag";
            this.displayedTableHeadRowV2 = document.createElement("th");
            this.displayedTableHeadRowV2.textContent = "V";
            this.displayedTableHeadRowD2 = document.createElement("th");
            this.displayedTableHeadRowD2.textContent = "D";
            this.displayedTableHeadRowTag2 = document.createElement("th");
            this.displayedTableHeadRowTag2.textContent = "Tag";
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowLRU);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowV1);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowD1);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowTag1);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowV2);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowD2);
            this.displayedTableHeadRow.appendChild(this.displayedTableHeadRowTag2);
        }
        
        this.displayedTableHead.appendChild(this.displayedTableHeadRow);
        this.displayedTable.appendChild(this.displayedTableHead);  
        // create the body for the cache table
        this.displayedTableBody = document.createElement("tbody");
        this.displayedTable.appendChild(this.displayedTableBody);
        this.promptDiv.appendChild(this.displayedTable);
    }

    // create the reference table element
    createReferenceTable() {
        this.referenceTable = document.createElement("table");
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
        
        this.bodyTableDiv.appendChild(this.referenceTable);
    }

    createAnswerTable() {
        this.answerTable = document.createElement("table");
        // create the head row for the reference table
        this.answerTableHead = document.createElement("thead");
        if ( this.cache_org === direct_mapped) {
            this.answerTableHead.innerHTML = 
            "<tr>" +
            "<th title=\"Hit?\" >H</th>"+
            "<th title=\"Miss?\" >M</th>"+
            "<th title=\"Index\" >Index</th>"+
            "<th title=\"Valid Bit\" >V</th>"+
            "<th title=\"Dirty Bit\" >D</th>"+
            "<th title=\"Tag Bit\" >Tag</th>"+
            "</tr> ";
        } else {
            this.answerTableHead.innerHTML = 
            "<tr>" +
            "<th title=\"Hit?\" >H</th>"+
            "<th title=\"Miss?\" >M</th>"+
            "<th title=\"Index\" >Index</th>"+
            "<th title=\"Least Recent Used bit\" >LRU</th>"+
            "<th title=\"Valid Bit\" >V</th>"+
            "<th title=\"Dirty Bit\" >D</th>"+
            "<th title=\"Tag Bit\" >Tag</th>"+
            "<th title=\"Valid Bit\" >V</th>"+
            "<th title=\"Dirty Bit\" >D</th>"+
            "<th title=\"Tag Bit\" >Tag</th>"+
            "</tr> ";
        }
        this.answerTable.appendChild(this.answerTableHead);  
        
        // create the body for the reference table
        this.answerTableBody = document.createElement("tbody");
        this.answerTable.appendChild(this.answerTableBody);
        
        this.bodyTableDiv.appendChild(this.answerTable);
    }

    // render the layout for tables
    renderLayout() {

        if ( this.cache_org === direct_mapped) {
            this.tableInfo.setAttribute("width", "25%");
            this.displayedTable.setAttribute("width", "35%");
            this.referenceTable.setAttribute("width", "25%");
            this.answerTable.setAttribute("width", "50%");
    
            this.displayedTableHeadRow0.setAttribute("width", "25%");
            this.displayedTableHeadRowV.setAttribute("width", "20%");
            this.displayedTableHeadRowD.setAttribute("width", "20%");
            this.displayedTableHeadRowTag.setAttribute("width", "35%");

            this.answerTableHead.rows[0].cells[0].setAttribute("width", "15%");
            this.answerTableHead.rows[0].cells[1].setAttribute("width", "15%");
            this.answerTableHead.rows[0].cells[2].setAttribute("width", "17.5%");
            this.answerTableHead.rows[0].cells[3].setAttribute("width", "14%");
            this.answerTableHead.rows[0].cells[4].setAttribute("width", "14%");
            this.answerTableHead.rows[0].cells[5].setAttribute("width", "24.5%");
        } else {
            this.tableInfo.setAttribute("width", "25%");
            this.displayedTable.setAttribute("width", "54%");
            this.referenceTable.setAttribute("width", "25%");
            this.answerTable.setAttribute("width", "60%");
    
            this.displayedTableHeadRow0.setAttribute("width", "10%");
            this.displayedTableHeadRowLRU.setAttribute("width", "10%");
            this.displayedTableHeadRowV1.setAttribute("width", "10%");
            this.displayedTableHeadRowD1.setAttribute("width", "10%");
            this.displayedTableHeadRowTag1.setAttribute("width", "20%");
            this.displayedTableHeadRowV2.setAttribute("width", "10%");
            this.displayedTableHeadRowD2.setAttribute("width", "10%");
            this.displayedTableHeadRowTag2.setAttribute("width", "20%");

            this.answerTableHead.rows[0].cells[0].setAttribute("width", "5%");
            this.answerTableHead.rows[0].cells[1].setAttribute("width", "5%");
            this.answerTableHead.rows[0].cells[2].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[3].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[4].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[5].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[6].setAttribute("width", "18%");
            this.answerTableHead.rows[0].cells[7].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[8].setAttribute("width", "9%");
            this.answerTableHead.rows[0].cells[9].setAttribute("width", "18%");
        }
    }
    
    // initialize the body of displayed cache table
    initDisplayedTableBody() {
        this.displayedTableBody.innerHTML = "";
        if (this.cache_org === direct_mapped ) {
            var tableRow, index, valid_bit, dirty_bit, tag_field;
            for ( var i = 0 ; i < this.num_rows ; i ++ ) {
                tableRow = document.createElement("tr");
                index = document.createElement("td");
                index.textContent = i.toString();
                valid_bit = document.createElement("td");
                valid_bit.textContent = "0"
                dirty_bit = document.createElement("td");
                dirty_bit.textContent = "0"
                tag_field = document.createElement("td");
                tableRow.appendChild(index);
                tableRow.appendChild(valid_bit);
                tableRow.appendChild(dirty_bit);
                tableRow.appendChild(tag_field);
                tableRow.style.backgroundColor = "white";
                this.displayedTableBody.appendChild(tableRow);
            }
        } else {
            var tableRow, index, lru_bit, valid_bit1, dirty_bit1, tag_field1, valid_bit2, dirty_bit2, tag_field2;
            for ( var i = 0 ; i < this.num_rows ; i ++ ) {
                tableRow = document.createElement("tr");
                index = document.createElement("td");
                index.textContent = i.toString();
                valid_bit1 = document.createElement("td");
                valid_bit1.textContent = "0";
                valid_bit2 = document.createElement("td");
                valid_bit2.textContent = "0";
                lru_bit = document.createElement("td");
                lru_bit.textContent = "0";
                dirty_bit1 = document.createElement("td");
                dirty_bit1.textContent = "0";
                dirty_bit2 = document.createElement("td");
                dirty_bit2.textContent = "0";
                tag_field1 = document.createElement("td");
                tag_field2 = document.createElement("td");
                tableRow.appendChild(index);
                tableRow.appendChild(lru_bit);
                tableRow.appendChild(valid_bit1);
                tableRow.appendChild(dirty_bit1);
                tableRow.appendChild(tag_field1);
                tableRow.appendChild(valid_bit2);
                tableRow.appendChild(dirty_bit2);
                tableRow.appendChild(tag_field2);
                tableRow.style.backgroundColor = "white";
                this.displayedTableBody.appendChild(tableRow);
            }
        }
    }

    // initialize the body of reference table
    initReferenceTableBody() {
        this.referenceTableBody.innerHTML = "";
    }

    // initialize the body of answer table
    initAnswerTableBody() {
        this.answerTableBody.innerHTML = "";
    }

    // update the reference table and answer table
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

    // update the body of the displayed cache table
    updateDisplayedTableBody() {
        const changed_line = this.answer_list[this.curr_ref-1][1];
        for (let i = 0; i < this.num_rows; i++) {
            if ( i === changed_line ) {
                // only update the changed line
                this.displayedTableBody.rows[i].style.backgroundColor = "yellow";
                this.updateDisplayedTableBodyRow(i);
            } else {
                this.displayedTableBody.rows[i].style.backgroundColor = "white";
            }
        }
    }

    // update a row of the body of the displayed cache table
    updateDisplayedTableBodyRow(index) {
        if ( this.cache_org === direct_mapped ) {
            // update the valid bit, dirty bit, tag bits
            this.displayedTableBody.rows[index].cells[1].textContent = this.curr_tagIndex_table[index][0].toString();
            this.displayedTableBody.rows[index].cells[2].textContent = this.curr_tagIndex_table[index][1].toString();
            this.displayedTableBody.rows[index].cells[3].textContent = this.curr_tagIndex_table[index][2];
        } else {
            // update the LRU and two sets of [valid bit, dirty bit, tag bits]
            this.displayedTableBody.rows[index].cells[1].textContent = this.curr_tagIndex_table[index][0].toString();
            this.displayedTableBody.rows[index].cells[2].textContent = this.curr_tagIndex_table[index][1].toString();
            this.displayedTableBody.rows[index].cells[3].textContent = this.curr_tagIndex_table[index][2].toString();
            this.displayedTableBody.rows[index].cells[4].textContent = this.curr_tagIndex_table[index][3];
            this.displayedTableBody.rows[index].cells[5].textContent = this.curr_tagIndex_table[index][4].toString();
            this.displayedTableBody.rows[index].cells[6].textContent = this.curr_tagIndex_table[index][5].toString();
            this.displayedTableBody.rows[index].cells[7].textContent = this.curr_tagIndex_table[index][6];
        }
    }

    // add a new row to the reference table
    addReferenceTableNewRow() {
        // create new row element
        var referenceTableNewRow = document.createElement("tr");
        // get the current reference number
        const curr_ref = this.curr_ref; 

        // the first column is the reference number
        var cellCurrRef = document.createElement("td");
        cellCurrRef.textContent = curr_ref.toString();
        referenceTableNewRow.appendChild(cellCurrRef);

        // the second column is the address
        const curr_address = this.answer_list[curr_ref][0];
        var cellCurrAddr = document.createElement("td");
        cellCurrAddr.textContent = curr_address;
        referenceTableNewRow.appendChild(cellCurrAddr);

        // the third column is RW
        const curr_RW = this.read_write_list[curr_ref] ? "W" : "R";
        var cellCurrRW = document.createElement("td");
        cellCurrRW.textContent = curr_RW;
        referenceTableNewRow.appendChild(cellCurrRW);

        this.referenceTableBody.appendChild(referenceTableNewRow);
    }

    // add a new row to the answer table
    addAnswerTableNewRow() {
        var answerTableNewRow = document.createElement("tr");
        
        // generate prompt side
        const curr_ref = this.getCurrRefStr(); // current reference number
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
        // generate input field for index
        var cellInputIndexBox = document.createElement("input");
        cellInputIndexBox.setAttribute("maxlength", "2");
        cellInputIndexBox.setAttribute("size", "2");
        cellInputIndexBox.setAttribute("type", "text");
        cellInputIndexBox.setAttribute("name", "Index" + curr_ref);
        var cellInputIndex = document.createElement("td");
        cellInputIndex.appendChild(cellInputIndexBox);
        answerTableNewRow.appendChild(cellInputIndex);

        // generate the LRU input field 
        if ( this.cache_org === two_way_set_associative ) {
            var cellInputLRUBox = document.createElement("input");
            cellInputLRUBox.setAttribute("maxlength", "1");
            cellInputLRUBox.setAttribute("size", "1");
            cellInputLRUBox.setAttribute("type", "text");
            cellInputLRUBox.setAttribute("name", "LRU" + curr_ref);
            var cellInputLRU = document.createElement("td");
            cellInputLRU.appendChild(cellInputLRUBox);
            answerTableNewRow.appendChild(cellInputLRU);            
        }

        // generate input field for valid bit
        var cellInputValidBox = document.createElement("input");
        cellInputValidBox.setAttribute("maxlength", "1");
        cellInputValidBox.setAttribute("size", "1");
        cellInputValidBox.setAttribute("type", "text");
        cellInputValidBox.setAttribute("name", "Valid" + curr_ref);
        var cellInputValid = document.createElement("td");
        cellInputValid.appendChild(cellInputValidBox);
        answerTableNewRow.appendChild(cellInputValid);

        // generate input field for dirty bit
        var cellInputDirtyBox = document.createElement("input");
        cellInputDirtyBox.setAttribute("maxlength", "1");
        cellInputDirtyBox.setAttribute("size", "1");
        cellInputDirtyBox.setAttribute("type", "text");
        cellInputDirtyBox.setAttribute("name", "Dirty" + curr_ref);
        var cellInputDirty = document.createElement("td");
        cellInputDirty.appendChild(cellInputDirtyBox);
        answerTableNewRow.appendChild(cellInputDirty);

        // generate input field for tag bits
        var cellInputTagBox = document.createElement("input");
        cellInputTagBox.setAttribute("maxlength", "8");
        cellInputTagBox.setAttribute("size", "5");
        cellInputTagBox.setAttribute("type", "text");
        cellInputTagBox.setAttribute("name", "Tag" + curr_ref);
        var cellInputTag = document.createElement("td");
        cellInputTag.appendChild(cellInputTagBox);
        answerTableNewRow.appendChild(cellInputTag);

        if ( this.cache_org === two_way_set_associative ) {
            // generate input field for valid bit
            var cellInputValidBox2 = document.createElement("input");
            cellInputValidBox2.setAttribute("maxlength", "1");
            cellInputValidBox2.setAttribute("size", "1");
            cellInputValidBox2.setAttribute("type", "text");
            cellInputValidBox2.setAttribute("name", "Valid2" + curr_ref);
            var cellInputValid2 = document.createElement("td");
            cellInputValid2.appendChild(cellInputValidBox2);
            answerTableNewRow.appendChild(cellInputValid2);

            // generate the second input field for dirty bit
            var cellInputDirtyBox2 = document.createElement("input");
            cellInputDirtyBox2.setAttribute("maxlength", "1");
            cellInputDirtyBox2.setAttribute("size", "1");
            cellInputDirtyBox2.setAttribute("type", "text");
            cellInputDirtyBox2.setAttribute("name", "Dirty2" + curr_ref);
            var cellInputDirty2 = document.createElement("td");
            cellInputDirty2.appendChild(cellInputDirtyBox2);
            answerTableNewRow.appendChild(cellInputDirty2);

            // generate the second input field for tag bits
            var cellInputTagBox2 = document.createElement("input");
            cellInputTagBox2.setAttribute("maxlength", "8");
            cellInputTagBox2.setAttribute("size", "5");
            cellInputTagBox2.setAttribute("type", "text");
            cellInputTagBox2.setAttribute("name", "Tag2" + curr_ref);
            var cellInputTag2 = document.createElement("td");
            cellInputTag2.appendChild(cellInputTagBox2);
            answerTableNewRow.appendChild(cellInputTag2);
        }

        // add the event listener for the last button 
        if ( this.cache_org === direct_mapped ) {
            cellInputTagBox.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitResponse();
                }
            }.bind(this), false);
        } else {
            cellInputTagBox2.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitResponse();
                }
            }.bind(this), false);
        }

        this.answerTableBody.appendChild(answerTableNewRow);
    }
    
    recordAnswered() {  
        // pass
    }

    // render the two buttons
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
                this.submitResponse();
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
                this.resetGeneration();
            }.bind(this),
            false
        );
        // put all buttons together
        this.buttonDiv.appendChild(this.generateButton);
        this.buttonDiv.appendChild(this.submitButton);
        this.buttonDiv.setAttribute("class", "aligned-tables");
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.buttonDiv);
    }

    // submit the response
    submitResponse() {
        if (this.curr_ref != this.num_refs ) {
            this.checkCurrentAnswer();
            if (this.correct) {
                this.curr_ref += 1;
                if (this.curr_ref < this.num_refs) {
                    // call next
                    this.updateDisplayedTableBody()
                    this.generateAnswerNext();
                    this.updateReferenceTableAndAnswerTable();
                } else {
                    // render feedback that congrats and this is all of the question
                    this.disableAnswerTableCurrentRow();
                    this.completed = true;
                }
            }
            this.logCurrentAnswer();
        }
    }

    // generate another cache table exercise
    resetGeneration() {
        this.initDisplayedTableBody();
        this.initReferenceTableBody();
        this.initAnswerTableBody();
        this.generateAnswerInit();
        this.generateAnswerNext();
        this.updateReferenceTableAndAnswerTable();
    }
    
    // render the feedback div
    renderCacheTableFeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }


    generateAnswerInit() {
        // initialize current reference number (int)
        this.curr_ref = 0;

        // generate hit miss (bool): hit = true; miss = false
        this.hit_miss_list = [];

        // generate read write list (bool): write = true; read = false
        this.read_write_list = [];
        
        // this table keeps track of [valid bit (int 0/1), dirty bit (int 0/1), tag (str)] with index meaning line number
        // in 2-way set associative, it is [LRU bit, valid bit(1), dirty bit(1), tag(1), valid bit(2), dirty bit(2), tag(2)]
        // Remark: this table size is fixed
        this.curr_tagIndex_table = [];

        // this list keeps track of the answer in terms of [address, line# (int), dirty bit (int 0/1), tag (str)]
        // in 2-way set associative, it is [address, line#, LRU bit, valid bit(1), dirty bit(1), tag(1), valid bit(2), dirty bit(2), tag(2)]
        // Remark: this list size grows as there is growing number of steps
        this.answer_list = [];

        // initialize the variable that traces whether a response is correct
        this.correct = null;

        // this is the flag that indicates whether one practice is completed 
        this.completed = false;

        // add some random lines to the cache table
        this.addRandomInitLines();
    }

    addRandomInitLines() {
        if (this.cache_org === direct_mapped ) {
            var valid_init, dirty_init, tag_init, currRand;
            for (let i = 0; i < this.num_rows; i++) {
                currRand = Math.random();
                if (currRand < this.init_valid_rate) {
                    valid_init = 1;
                    tag_init = this.generateTag();
                    dirty_init = this.getRandomBit();
                } else {
                    valid_init = 0;
                    dirty_init = 0;
                    tag_init = "";
                    if ( currRand > 0.81 ) {
                        tag_init = this.generateTag();
                        if ( currRand > 0.9 ) {
                            dirty_init = 1;
                        }
                    }
                }
                this.curr_tagIndex_table.push([valid_init, dirty_init, tag_init]);
            }
        } else {
            var lru_init, valid_init1, dirty_init1, tag_init1;
            var valid_init2, dirty_init2, tag_init2, currRand1, currRand2;
            for (let i = 0; i < this.num_rows; i++) {
                lru_init = this.getRandomBit();
                currRand1 = Math.random();
                if (currRand1 < this.init_valid_rate) {
                    valid_init1 = 1;
                    tag_init1 = this.generateTag();
                    dirty_init1 = this.getRandomBit();
                } else {
                    valid_init1 = 0;
                    dirty_init1 = 0;
                    tag_init1 = "";
                    if ( currRand1 > 0.81 ) {
                        tag_init1 = this.generateTag();
                        if ( currRand1 > 0.9 ) {
                            dirty_init1 = 1;
                        }
                    }
                }
                currRand2 = Math.random();
                if (currRand2 < this.init_valid_rate) {
                    valid_init2 = 1;
                    tag_init2 = this.generateTag();
                    dirty_init2 = this.getRandomBit();
                } else {
                    valid_init2 = 0;
                    dirty_init2 = 0;
                    tag_init2 = "";
                    if ( currRand2 > 0.81 ) {
                        tag_init2 = this.generateTag();
                        if ( currRand2 > 0.9 ) {
                            dirty_init2 = 1;
                        }
                    }
                }
                this.curr_tagIndex_table.push([lru_init, valid_init1, dirty_init1, tag_init1,
                    valid_init2, dirty_init2, tag_init2]);
            }
        }
        for (let i = 0; i < this.num_rows; i++) {
            this.updateDisplayedTableBodyRow(i);
        }
    }

    generateAnswerNext() {

        // determine the read/ write for this step - always half half
        // write = true; read = false
        const curr_rw = this.getRandomBit() === 0 ? false : true;
        this.read_write_list.push(curr_rw);

        if ( this.cache_org === direct_mapped ) {
            // generate current tagIndex
            var currtagIndex;
            let valid_tagIndex_list = []; 
            for (var j = 0; j < this.curr_tagIndex_table.length; j++) { // collect all current valid tagIndices
                if (this.curr_tagIndex_table[j][0] == 1) {
                    valid_tagIndex_list.push(this.curr_tagIndex_table[j][2] + this.toBinary(j, this.index_bits));
                }
            }

            // determine the hit/ miss answer for this step
            var curr_hm; // hit = true; miss = false
            if (valid_tagIndex_list.length == 0) { // when there is no valid line, it is always miss
                curr_hm = false;
            } else if (this.curr_ref <= 1) { // second half half
                curr_hm = this.getRandomBit() === 0 ? true : false;
            } else {
                // if previous two hits, miss this time
                if (this.hit_miss_list[this.curr_ref - 2] && this.hit_miss_list[this.curr_ref - 1]) {
                    curr_hm = false;
                } else { // otherwise half half
                    curr_hm = this.getRandomBit() === 0 ? true : false;
                }
            }
            this.hit_miss_list.push(curr_hm);

            // console.log(valid_tagIndex_list)
            if (curr_hm) {
                // if it is a hit, pick a valid tagIndex to proceed
                let currRand = Math.floor(Math.random() * valid_tagIndex_list.length);
                currtagIndex = valid_tagIndex_list[currRand];
            } else {
                // if it is a miss, then generate a new tagIndex
                currtagIndex = this.generateTagIndex();
                if (valid_tagIndex_list.length > 0 ) {
                    while (valid_tagIndex_list.includes(currtagIndex)) {
                        currtagIndex = this.generateTagIndex();
                    }
                }
            }

            const curr_tag_b = currtagIndex.slice(0, this.tag_bits);
            const curr_idx_b = currtagIndex.slice(-this.index_bits);
            const curr_idx_d = this.binary2decimal(curr_idx_b);
            const curr_address = currtagIndex + this.generateOffset();
            const curr_valid = this.curr_tagIndex_table[curr_idx_d][0];
            // generate current dirty bit
            const curr_d = this.calculateDirtyBit(curr_valid, curr_rw, curr_hm, this.curr_tagIndex_table[curr_idx_d][1]);
            
            // reflect the changes in answer_list and curr_tagIndex_table
            this.answer_list.push([curr_address, curr_idx_d, curr_d, curr_tag_b]);
            this.curr_tagIndex_table[curr_idx_d][0] = 1; // change valid bit to 1
            this.curr_tagIndex_table[curr_idx_d][1] = curr_d; // change dirty bit to corresponding value
            this.curr_tagIndex_table[curr_idx_d][2] = curr_tag_b; // change tag to corresponding string
        } else {

            // generate current tagIndex
            var currtagIndex;
            let valid_tagIndex_list = []; 
            for (var j = 0; j < this.curr_tagIndex_table.length; j++) { // collect all current valid tagIndices
                if (this.curr_tagIndex_table[j][1] == 1) {
                    valid_tagIndex_list.push(this.curr_tagIndex_table[j][3] + this.toBinary(j, this.index_bits));
                }
                if (this.curr_tagIndex_table[j][4] == 1) {
                    valid_tagIndex_list.push(this.curr_tagIndex_table[j][6] + this.toBinary(j, this.index_bits));
                }
            }

            // determine the hit/ miss answer for this step
            var curr_hm; // hit = true; miss = false
            if (valid_tagIndex_list.length == 0) { // when there is no valid line, it is always miss
                curr_hm = false;
            } else if (this.curr_ref <= 1) { // second half half
                curr_hm = this.getRandomBit() === 0 ? true : false;
            } else {
                // if previous two hits, miss this time
                if (this.hit_miss_list[this.curr_ref - 2] && this.hit_miss_list[this.curr_ref - 1]) {
                    curr_hm = false;
                } else { // otherwise half half
                    curr_hm = this.getRandomBit() === 0 ? true : false;
                }
            }
            this.hit_miss_list.push(curr_hm);

            if (curr_hm) {
                // if it is a hit, pick a valid tagIndex to proceed
                let currRand = Math.floor(Math.random() * valid_tagIndex_list.length);
                currtagIndex = valid_tagIndex_list[currRand];
            } else {
                // if it is a miss, then generate a new tagIndex
                currtagIndex = this.generateTagIndex();
                if (valid_tagIndex_list.length > 0 ) {
                    while (valid_tagIndex_list.includes(currtagIndex)) {
                        currtagIndex = this.generateTagIndex();
                    }
                }
            }

            const curr_idx_b = currtagIndex.slice(-this.index_bits);
            const curr_idx_d = this.binary2decimal(curr_idx_b);
            const curr_tag_b = currtagIndex.slice(0, this.tag_bits);
            const curr_address = currtagIndex + this.generateOffset();
            // previous lru
            const prev_lru = this.curr_tagIndex_table[curr_idx_d][0];
            const prev_valid1 = this.curr_tagIndex_table[curr_idx_d][1];
            const prev_dirty1 = this.curr_tagIndex_table[curr_idx_d][2];
            const prev_tag1 = this.curr_tagIndex_table[curr_idx_d][3];
            const prev_valid2 = this.curr_tagIndex_table[curr_idx_d][4];
            const prev_dirty2 = this.curr_tagIndex_table[curr_idx_d][5];
            const prev_tag2 = this.curr_tagIndex_table[curr_idx_d][6];
            var curr_lru = null;
            var ans_tag_1 = null;
            var ans_tag_2 = null;
            var ans_valid_1 = null;
            var ans_valid_2 = null;
            var ans_dirty_1 = null;
            var ans_dirty_2 = null;
            if ( curr_hm ) {
                if ( curr_tag_b === prev_tag1 ) {
                    curr_lru = 1;
                } else {
                    curr_lru = 0;
                }
            } else {
                // check if there is no available space
                if ( prev_valid1 && prev_valid2 ) {
                    if ( prev_lru === 1 ) {
                        curr_lru = 0;
                    } else {
                        curr_lru = 1;
                    }
                } else { // occupy the available one
                    // if both available, occupy the one previous LRU points to
                    if ( prev_valid1 == prev_valid2 ) {
                        curr_lru = 1 - prev_lru;
                    } else if ( prev_valid1 ) { // otherwise, occupy the one with valid bit 0
                        curr_lru = 0;
                    } else {
                        curr_lru = 1;
                    }
                }
            }

            // determine the answer based on current LRU
            if (curr_lru == 1) {
                ans_valid_2 = prev_valid2;
                ans_dirty_2 = prev_dirty2;
                ans_tag_2 = prev_tag2;

                ans_valid_1 = 1;
                ans_dirty_1 = 
                    this.calculateDirtyBit(prev_valid1, curr_rw, 
                    curr_hm, prev_dirty1);
                ans_tag_1 = curr_tag_b;
            } else {
                ans_valid_1 = prev_valid1;
                ans_dirty_1 = prev_dirty1;
                ans_tag_1 = prev_tag1;

                ans_valid_2 = 1;
                ans_dirty_2 = 
                    this.calculateDirtyBit(prev_valid2, curr_rw, 
                    curr_hm, prev_dirty2);
                ans_tag_2 = curr_tag_b;
            }
            
            // reflect the changes in answer_list and curr_tagIndex_table
            this.answer_list.push([curr_address, curr_idx_d, curr_lru,
            ans_valid_1, ans_dirty_1, ans_tag_1, ans_valid_2, ans_dirty_2, ans_tag_2]);

            this.curr_tagIndex_table[curr_idx_d][0] = curr_lru; 
            this.curr_tagIndex_table[curr_idx_d][1] = ans_valid_1; 
            this.curr_tagIndex_table[curr_idx_d][2] = ans_dirty_1; 
            this.curr_tagIndex_table[curr_idx_d][3] = ans_tag_1; 
            this.curr_tagIndex_table[curr_idx_d][4] = ans_valid_2; 
            this.curr_tagIndex_table[curr_idx_d][5] = ans_dirty_2; 
            this.curr_tagIndex_table[curr_idx_d][6] = ans_tag_2; 
            // const curr_address = "00000000";
            // this.answer_list.push([curr_address]);
        }

    }

    /*===================================
    === Helper functions             ===
    ===================================*/
    
    // calculate the dirty bit
    // isValid:     bool
    // isWrite:     bool
    // isHit:       bool
    // PrevDirtyBit:bool 
    calculateDirtyBit(isValid, isWrite, isHit, PrevDirtyBit) {
        if (isWrite) { // if it is a write request, always set dirty bit to 1
            return 1;
        } else { // if it is a read request
            if (isHit) { // then if it is a hit, match current dirty bit state to that of the previous content
                if (PrevDirtyBit == 1 && isValid == 1) {
                    return 1;
                } else {
                    return 0;
                }
            } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
                return 0;
            }
        }
    }

    // convert a binary string expression to integer
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

    // generate a random bit
    // r is the probability to get 0
    getRandomBit(r=0.5) {
        return Math.random() > r ? 1 : 0;
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

    // generate a random memory address with length=len
    generateAddress(len) {
        var addr = "";
        for (let i = 0; i < len; i++) {
            addr += this.getRandomBit().toString();
        }
        return addr;
    }

    generateTag() {
        return this.generateAddress(this.tag_bits);
    }

    generateTagIndex() {
        return this.generateAddress(this.tag_bits + this.index_bits);
    }

    generateOffset() {
        return this.generateAddress(this.offset_bits);
    }

    // get the string of this div id plus current reference number 
    getCurrRefStr() {
        return this.divid.toString() + "-" + this.curr_ref.toString();
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
        const curr_ref_str = this.getCurrRefStr();
        try {
            const response_hit_miss = 
                document.querySelector('input[name="HM' + curr_ref_str + '"]:checked').value === "H" ? true : false;
            const response_index =
                document.querySelector('input[name="Index' + curr_ref_str + '"]').value;
            const response_dirty =
                document.querySelector('input[name="Dirty' + curr_ref_str + '"]').value;
            const response_valid =
                document.querySelector('input[name="Valid' + curr_ref_str + '"]').value;
            const response_tag =
                document.querySelector('input[name="Tag' + curr_ref_str + '"]').value;
            const curr_answers = this.answer_list[ curr_ref ];
            // console.log(curr_answers);

            if ( this.hit_miss_list[ curr_ref ] != response_hit_miss  ) {
                this.correct = false;
            }
            if ( curr_answers[ 1 ].toString() != response_index ) {
                this.correct = false;
            }
            // in 2-way set associative, we need to check 4 extra input fields
            if ( this.cache_org === two_way_set_associative ) {
                const response_lru = 
                    document.querySelector('input[name="LRU' + curr_ref_str + '"]').value;
                const response_dirty2 =
                    document.querySelector('input[name="Dirty2' + curr_ref_str + '"]').value;
                const response_valid2 =
                    document.querySelector('input[name="Valid2' + curr_ref_str + '"]').value;
                const response_tag2 =
                    document.querySelector('input[name="Tag2' + curr_ref_str + '"]').value;
                if ( curr_answers[ 2 ].toString() != response_lru ) {
                    this.correct = false;
                }
                if ( curr_answers[ 3 ].toString() != response_valid ) {
                    this.correct = false;
                }
                if ( curr_answers[ 4 ].toString() != response_dirty ) {
                    this.correct = false;
                }
                if ( curr_answers[ 5 ].toString() != response_tag ) {
                    this.correct = false;
                }       
                if ( curr_answers[ 6 ].toString() != response_valid2 ) {
                    this.correct = false;
                }
                if ( curr_answers[ 7 ].toString() != response_dirty2 ) {
                    this.correct = false;
                }
                if ( curr_answers[ 8 ].toString() != response_tag2 ) {
                    this.correct = false;
                }       
            } else {
                if ( response_valid != "1" ) {
                    this.correct = false;
                }
                if ( curr_answers[ 2 ].toString() != response_dirty ) {
                    this.correct = false;
                }
                if ( curr_answers[ 3 ].toString() != response_tag ) {
                    this.correct = false;
                }       
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
            if (this.completed) {
                feedback_html += "<div>" + $.i18n("msg_cachetable_completed") + "</div>";
            } else {
                feedback_html += "<div>" + $.i18n("msg_cachetable_correct") + "</div>";                
            }
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
