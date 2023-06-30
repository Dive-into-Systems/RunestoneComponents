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

const directMapped = "Direct-Mapped";
const twoWaySetAssociative = "2-Way Set Associative";
const algo_boost = "boost";
const algo_hitNmiss = "hitNmiss";

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

    // set the default parameters
    setDefaultParams() {
        this.cacheOrg = directMapped; 
        this.algorithm = algo_boost;
        this.numBits = 8;
        this.offsetBits = 2;
        this.blockSize = 1 << this.offsetBits;
        this.indexBits = 2;
        this.numRows = 1 << this.indexBits;
        this.tagBits = this.numBits - this.indexBits - this.offsetBits;
        this.numRefs = 8;
        this.initValidRate = 0.3;
        this.debug = false;

        this.fixed = false;
        this.cacheTableInit = null;
        this.referenceList = null;

        this.chance_hit = 1/3;
        this.hit_incr = 1/3;
        this.chance_conf = 0.5;
        this.conf_incr = 0.25
    }

    // load customized parameters
    loadParams() {
        try {
            const currentOptions = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (currentOptions["bits"] != undefined) {
                this.numBits = eval(currentOptions["bits"]);
            }
            if (currentOptions["cache-org"] != undefined) {
                this.cacheOrg = currentOptions["cache-org"];
            }
            if (currentOptions["offset"] != undefined) {
                this.offsetBits = eval(currentOptions["offset"]);
                this.blockSize = 1 << this.offsetBits;
            }            
            if (currentOptions["index"] != undefined) {
                this.indexBits = eval(currentOptions["index"]);
                this.numRows = 1 << this.indexBits;
            }
            if (currentOptions["num-references"] != undefined) {
                this.numRefs = eval(currentOptions["num-references"]);
            }
            if (currentOptions["init-valid-rate"] != undefined) {
                this.initValidRate = eval(currentOptions["init-valid-rate"]);
            }
            if (currentOptions["debug"] != undefined) {
                this.debug = eval(currentOptions["debug"]);
            }
            if (currentOptions["algorithm"] != undefined) {
                this.algorithm = currentOptions["algorithm"];
            }
            if (currentOptions["fixed"] != undefined) {
                this.fixed = eval(currentOptions["fixed"]);
                if ( this.fixed ) {
                    this.cacheTableInit = currentOptions["init-cache-table"];
                    this.referenceList = currentOptions["reference-list"];
                    if (this.cacheTableInit == null) {
                        this.cacheTableInit = [];
                    }
                } 
            }
            this.tagBits = this.numBits - this.indexBits - this.offsetBits;
        } catch (error) {
            // pass
            // console.log(error);
        }
    }

    renderCacheTableMain() {
        // create the main div
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.createStatement1();
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

    // create the div with general instructions 
    createStatement1() {
        this.statementDiv1 = document.createElement("div");
        this.statementDiv1.textContent = 
            "Given the cache table and its info below, fill in the effects for each memory address reference.";
        this.containerDiv.appendChild(this.statementDiv1);
    }
    
    // create the div with detailed help
    createHelpStatement() {
        this.helpDiv = document.createElement("div");
        this.helpStatement = document.createElement("div");
        if ( this.cacheOrg == directMapped ) {
            this.helpStatement.innerHTML = 
                "<div>'H' stands for hit, and 'M' stands for miss. You should choose one from them. </div>" +
                "<div>Index should be a decimal number. 'V' stands for Valid Bit. </div> " +
                "<div>'D' stands for Dirty Bit. Tag should be a binary string. </div>";
        } else {
            this.helpStatement.innerHTML = 
                "<div>'H' stands for hit, and 'M' stands for miss. You should choose one from them. </div>" +
                "<div>Index should be a decimal number. 'V' stands for Valid Bit. </div>" +
                "<div>'D' stands for Dirty Bit. Tag should be a binary string. </div>" + 
                "<div>'LRU' stands for Least Recent Used Bit. LRU=0 means the left line is the least recent used line, and vice versa. </div>";
        }
        if ( this.hasSeed) {
            this.helpStatement.innerHTML += 
                "<div>Click 'check me' to check your response. Click 'Redo the exercise' to reset and redo the exercise.</div>";
        } else {
            this.helpStatement.innerHTML += 
                "<div>Click 'check me' to check your response. Click 'Generate Another' to generate another exercise.</div>";
        }
        this.helpStatement.style.visibility = "hidden";
        // create the button for display/hide help
        this.helpButton = document.createElement("button");
        this.helpButton.textContent = $.i18n("msg_cachetable_display_help");
        this.helpButton.addEventListener(            
            "click",
            function() {
                if (this.helpStatement.style.visibility == "hidden") {
                    this.helpStatement.style.visibility = "visible";
                    this.helpDiv.appendChild(this.helpStatement);
                    this.helpButton.textContent = $.i18n("msg_cachetable_hide_help");
                } else {
                    this.helpStatement.style.visibility = "hidden";
                    this.helpDiv.removeChild(this.helpStatement);
                    this.helpButton.textContent = $.i18n("msg_cachetable_display_help");
                }
            }.bind(this),
        false); 
        this.helpDiv.appendChild(this.helpButton);
        this.containerDiv.appendChild(this.helpDiv);
    }

    // create the table that displays the necessary information for the cache exercise
    createTableInfo() {
        this.tableInfo = document.createElement("table");
        this.tableInfo.innerHTML = 
        "<thead>" +
        "    <tr><td>Cache Table Info</td></tr>" +
        "</thead>" +
        "<tr>" + 
        "   <td>" + this.cacheOrg + "</td>" +
        "</tr>" +
        "<tr>" +
        "   <td>" + this.numBits.toString() + "-bit Address</td>" + 
        "</tr>" +
        "<tr>" +
        "   <td>Block Size : " + this.blockSize.toString() + "</td>" +
        "</tr>" +
        "<tr>" +
        "   <td>Number of rows : " + this.numRows.toString() + "</td>" +
        "</tr>";
        
        this.promptDiv.appendChild(this.tableInfo);
    }
    // height: auto; display:flex; flex-direction: row; justify-content:space-between
    // create the cache table to display
    createDisplayedTable() {
        this.displayedTable = document.createElement("table");
        // create the head row for the cache table
        this.displayedTableHead = document.createElement("thead");

        if (this.cacheOrg === directMapped) {
            this.displayedTableHead.innerHTML = 
            "<tr>" +
            "   <th colspan=\"4\">Cache Table Content</th>" +
            "</tr>" +
            "<tr>" +
            "    <th>Index</th>" +
            "    <th>V</th>" +
            "    <th>D</th>" +
            "    <th>Tag</th>" +
            "</tr>";
   
        } else { // if it is 2-way set associative
            this.displayedTableHead.innerHTML = 
            "<tr>" +
            "   <th colspan=\"8\">Cache Table Content</th>" +
            "</tr>" +
            "<tr>" +
            "    <th>Index</th>" +
            "    <th>LRU</th>" +
            "    <th>V</th>" +
            "    <th>D</th>" +
            "    <th>Tag</th>" +
            "    <th>V</th>" +
            "    <th>D</th>" +
            "    <th>Tag</th>" +
            "</tr>";
        }
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
        "<tr><th colspan=\"3\">Memory Operations</th></tr>" + 
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
        if ( this.cacheOrg === directMapped) {
            this.answerTableHead.innerHTML = 
            "<tr><th colspan=\"6\">Effects from Memory Reference</th></tr>" + 
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
            "<tr><th colspan=\"10\">Effects from Memory Reference (only fill in the line being affected)</th></tr>" + 
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

        if ( this.cacheOrg === directMapped) {
            this.tableInfo.setAttribute("width", "25%");
            this.displayedTable.setAttribute("width", "35%");
            this.referenceTable.setAttribute("width", "25%");
            this.answerTable.setAttribute("width", "50%");
    
            this.displayedTableHead.rows[1].cells[0].setAttribute("width", "25%");
            this.displayedTableHead.rows[1].cells[1].setAttribute("width", "20%");
            this.displayedTableHead.rows[1].cells[2].setAttribute("width", "20%");
            this.displayedTableHead.rows[1].cells[3].setAttribute("width", "35%");

            this.answerTableHead.rows[1].cells[0].setAttribute("width", "15%");
            this.answerTableHead.rows[1].cells[1].setAttribute("width", "15%");
            this.answerTableHead.rows[1].cells[2].setAttribute("width", "17.5%");
            this.answerTableHead.rows[1].cells[3].setAttribute("width", "14%");
            this.answerTableHead.rows[1].cells[4].setAttribute("width", "14%");
            this.answerTableHead.rows[1].cells[5].setAttribute("width", "24.5%");
        } else {
            this.tableInfo.setAttribute("width", "25%");
            this.displayedTable.setAttribute("width", "63%");
            this.referenceTable.setAttribute("width", "25%");
            this.answerTable.setAttribute("width", "70%");
    
            this.displayedTableHead.rows[1].cells[0].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[1].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[2].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[3].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[4].setAttribute("width", "20%");
            this.displayedTableHead.rows[1].cells[5].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[6].setAttribute("width", "10%");
            this.displayedTableHead.rows[1].cells[7].setAttribute("width", "20%");

            this.answerTableHead.rows[1].cells[0].setAttribute("width", "5%");
            this.answerTableHead.rows[1].cells[1].setAttribute("width", "5%");
            this.answerTableHead.rows[1].cells[2].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[3].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[4].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[5].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[6].setAttribute("width", "18%");
            this.answerTableHead.rows[1].cells[7].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[8].setAttribute("width", "9%");
            this.answerTableHead.rows[1].cells[9].setAttribute("width", "18%");
        }
    }
    
    // initialize the body of displayed cache table
    initDisplayedTableBody() {
        this.displayedTableBody.innerHTML = "";
        if (this.cacheOrg === directMapped ) {
            var tableRow;
            for ( var i = 0 ; i < this.numRows ; i ++ ) {
                tableRow = document.createElement("tr");
                tableRow.innerHTML = 
                "<td>"+ i.toString() +"</td>" + 
                "<td>0</td>" +
                "<td>0</td>" +
                "<td></td>";
                tableRow.style.backgroundColor = "white";
                this.displayedTableBody.appendChild(tableRow);
            }
        } else {
            var tableRow;
            for ( var i = 0 ; i < this.numRows ; i ++ ) {
                tableRow = document.createElement("tr");
                tableRow = document.createElement("tr");
                tableRow.innerHTML = 
                "<td>"+ i.toString() +"</td>" + 
                "<td>0</td>" +
                "<td>0</td>" +
                "<td>0</td>" +
                "<td></td>" +
                "<td>0</td>" +
                "<td>0</td>" +
                "<td></td>";
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
            this.disableAnswerTableCurrentRow(this.curr_ref-1);
        }
        this.addReferenceTableNewRow();
        this.addAnswerTableNewRow();
    }

    // disable all the input fields of the previous row
    disableAnswerTableCurrentRow(ref) {
        for ( var old_cell of this.answerTableBody.rows[ ref ].cells ) {
            for ( var field of old_cell.children ) {
                field.setAttribute("readonly", "readonly");
                field.setAttribute("disabled", "disabled");
            }
        }
    } 

    disableOneInputField(field) {
        field.setAttribute("disabled", "disabled");
        field.value = "";
        field.style.visibility = "hidden";
    }

    disableCacheLineLeft() {
        const curr_ref_str = this.getCurrRefStr();
        this.disableOneInputField(document.querySelector('input[name="Tag' + curr_ref_str + '"]'));
        this.disableOneInputField(document.querySelector('input[name="Dirty' + curr_ref_str + '"]'));
        this.disableOneInputField(document.querySelector('input[name="Valid' + curr_ref_str + '"]'));
    }

    disableCacheLineRight() {
        const curr_ref_str = this.getCurrRefStr();
        this.disableOneInputField(document.querySelector('input[name="Tag2' + curr_ref_str + '"]'));
        this.disableOneInputField(document.querySelector('input[name="Dirty2' + curr_ref_str + '"]'));
        this.disableOneInputField(document.querySelector('input[name="Valid2' + curr_ref_str + '"]'));
    }

    activateOneInputField(field) {
        field.removeAttribute("disabled");
        field.style.visibility = "visible";
    }

    activateCacheLineLeft() {
        const curr_ref_str = this.getCurrRefStr();
        this.activateOneInputField(document.querySelector('input[name="Tag' + curr_ref_str + '"]'));
        this.activateOneInputField(document.querySelector('input[name="Dirty' + curr_ref_str + '"]'));
        this.activateOneInputField(document.querySelector('input[name="Valid' + curr_ref_str + '"]'));
    }

    activateCacheLineRight() {
        const curr_ref_str = this.getCurrRefStr();
        this.activateOneInputField(document.querySelector('input[name="Tag2' + curr_ref_str + '"]'));
        this.activateOneInputField(document.querySelector('input[name="Dirty2' + curr_ref_str + '"]'));
        this.activateOneInputField(document.querySelector('input[name="Valid2' + curr_ref_str + '"]'));
    }

    onlyBitAllowed(event) {
        return event.charCode == 48 || event.charCode == 49;
    }
    // update the body of the displayed cache table
    updateDisplayedTableBody() {
        this.setCellsToDefault();
        const changed_line = this.answer_list[this.curr_ref-1][1];
        for (let i = 0; i < this.numRows; i++) {
            if ( i === changed_line ) {
                // only update the changed line
                this.updateDisplayedTableBodyRow(i);
                this.highlightChanges(i);
            } 
        }
    }

    // update a row of the body of the displayed cache table
    updateDisplayedTableBodyRow(index) {
        if ( this.cacheOrg === directMapped ) {
            // update the valid bit, dirty bit, tag bits
            this.displayedTableBody.rows[index].cells[1].textContent = this.curr_tagIndex_table[index][0][0].toString();
            this.displayedTableBody.rows[index].cells[2].textContent = this.curr_tagIndex_table[index][0][1].toString();
            this.displayedTableBody.rows[index].cells[3].textContent = this.curr_tagIndex_table[index][0][2];
        } else {
            // update the LRU and two sets of [valid bit, dirty bit, tag bits]
            this.displayedTableBody.rows[index].cells[1].textContent = this.curr_tagIndex_table[index][2].toString();
            this.displayedTableBody.rows[index].cells[2].textContent = this.curr_tagIndex_table[index][0][0].toString();
            this.displayedTableBody.rows[index].cells[3].textContent = this.curr_tagIndex_table[index][0][1].toString();
            this.displayedTableBody.rows[index].cells[4].textContent = this.curr_tagIndex_table[index][0][2];
            this.displayedTableBody.rows[index].cells[5].textContent = this.curr_tagIndex_table[index][1][0].toString();
            this.displayedTableBody.rows[index].cells[6].textContent = this.curr_tagIndex_table[index][1][1].toString();
            this.displayedTableBody.rows[index].cells[7].textContent = this.curr_tagIndex_table[index][1][2];
        }
    }

    setCellsToDefault() {
        for (var row of this.displayedTableBody.rows) {
            for (var cell of row.cells) {
                // console.log(cell);
                cell.style.backgroundColor = "white";
            }
        }
    }

    highlightChanges(index) {
        this.displayedTableBody.rows[index].cells[0].style.backgroundColor = "yellow";
        if ( this.cacheOrg === directMapped ) {
            // highlight the valid bit, dirty bit, tag bits
            this.displayedTableBody.rows[index].cells[1].style.backgroundColor = "yellow";
            this.displayedTableBody.rows[index].cells[2].style.backgroundColor = "yellow";
            this.displayedTableBody.rows[index].cells[3].style.backgroundColor = "yellow";
        } else {
            this.displayedTableBody.rows[index].cells[1].style.backgroundColor = "yellow";
            const curr_lru = this.displayedTableBody.rows[index].cells[1].textContent;
            if (curr_lru == "1") {
                this.displayedTableBody.rows[index].cells[2].style.backgroundColor = "yellow";
                this.displayedTableBody.rows[index].cells[3].style.backgroundColor = "yellow";
                this.displayedTableBody.rows[index].cells[4].style.backgroundColor = "yellow";
            } else {
                this.displayedTableBody.rows[index].cells[5].style.backgroundColor = "yellow";
                this.displayedTableBody.rows[index].cells[6].style.backgroundColor = "yellow";
                this.displayedTableBody.rows[index].cells[7].style.backgroundColor = "yellow";
            }
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
        $(cellHitBox).attr({
            type: "radio",
            value: "H",
            name: "HM" + curr_ref,
            id: "Hit" + curr_ref
        });
        cellHit.appendChild(cellHitBox);
        answerTableNewRow.appendChild(cellHit);
        
        var cellMiss = document.createElement("td");
        var cellMissBox = document.createElement("input");
        $(cellMissBox).attr({
            type: "radio",
            value: "M",
            name: "HM" + curr_ref,
            id: "Miss" + curr_ref
        });
        cellMiss.appendChild(cellMissBox);
        answerTableNewRow.appendChild(cellMiss);

        // generate normal input fields
        // generate input field for index
        var cellInputIndexBox = document.createElement("input");
        $(cellInputIndexBox).attr({
            type: "text",
            size: "2",
            maxlength: "2",
            name: "Index" + curr_ref,
        });
        var cellInputIndex = document.createElement("td");
        cellInputIndex.appendChild(cellInputIndexBox);
        answerTableNewRow.appendChild(cellInputIndex);

        // generate the LRU input field 
        if ( this.cacheOrg === twoWaySetAssociative ) {
            var cellInputLRUBox = document.createElement("input");
            $(cellInputLRUBox).attr({
                type: "text",
                size: "1",
                maxlength: "1",
                name: "LRU" + curr_ref,
            });
            var cellInputLRU = document.createElement("td");
            cellInputLRU.appendChild(cellInputLRUBox);
            answerTableNewRow.appendChild(cellInputLRU);            
        }

        // generate input field for valid bit
        var cellInputValidBox = document.createElement("input");
        $(cellInputValidBox).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Valid" + curr_ref,
        });
        var cellInputValid = document.createElement("td");
        cellInputValid.appendChild(cellInputValidBox);
        answerTableNewRow.appendChild(cellInputValid);

        // generate input field for dirty bit
        var cellInputDirtyBox = document.createElement("input");
        $(cellInputDirtyBox).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Dirty" + curr_ref,
        });
        var cellInputDirty = document.createElement("td");
        cellInputDirty.appendChild(cellInputDirtyBox);
        answerTableNewRow.appendChild(cellInputDirty);

        // generate input field for tag bits
        var cellInputTagBox = document.createElement("input");
        $(cellInputTagBox).attr({
            type: "text",
            size: "5",
            maxlength: "8",
            name: "Tag" + curr_ref,
        });
        var cellInputTag = document.createElement("td");
        cellInputTag.appendChild(cellInputTagBox);
        answerTableNewRow.appendChild(cellInputTag);

        if ( this.cacheOrg === twoWaySetAssociative ) {
            // generate input field for valid bit
            var cellInputValidBox2 = document.createElement("input");
            $(cellInputValidBox2).attr({
                type: "text",
                size: "1",
                maxlength: "1",
                name: "Valid2" + curr_ref,
            });
            var cellInputValid2 = document.createElement("td");
            cellInputValid2.appendChild(cellInputValidBox2);
            answerTableNewRow.appendChild(cellInputValid2);

            // generate the second input field for dirty bit
            var cellInputDirtyBox2 = document.createElement("input");
            $(cellInputDirtyBox2).attr({
                type: "text",
                size: "1",
                maxlength: "1",
                name: "Dirty2" + curr_ref,
            });
            var cellInputDirty2 = document.createElement("td");
            cellInputDirty2.appendChild(cellInputDirtyBox2);
            answerTableNewRow.appendChild(cellInputDirty2);

            // generate the second input field for tag bits
            var cellInputTagBox2 = document.createElement("input");
            $(cellInputTagBox2).attr({
                type: "text",
                size: "5",
                maxlength: "8",
                name: "Tag2" + curr_ref,
            });
            var cellInputTag2 = document.createElement("td");
            cellInputTag2.appendChild(cellInputTagBox2);
            answerTableNewRow.appendChild(cellInputTag2);

            cellInputDirtyBox.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
            cellInputDirtyBox2.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
            cellInputValidBox.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
            cellInputValidBox2.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
            cellInputTagBox.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
            cellInputTagBox2.addEventListener("keyup",
                function() {
                    this.displayNecessaryFields();
                }.bind(this),
                false
            );
        }

        // add the event listener for the last button 
        if ( this.cacheOrg === twoWaySetAssociative ) {
            cellInputTagBox2.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitResponse();
                }
            }.bind(this), false);
        } 
        cellInputTagBox.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submitResponse();
            }
        }.bind(this), false);

        this.answerTableBody.appendChild(answerTableNewRow);
    }
    
    recordAnswered() {  
        // pass
    }

    // only display the input fields that will be changed
    displayNecessaryFields() {
        this.activateCacheLineLeft();
        this.activateCacheLineRight();
        const curr_ref_str = this.getCurrRefStr();
        const response_left = 
            document.querySelector('input[name="Valid' + curr_ref_str + '"]').value
            + document.querySelector('input[name="Dirty' + curr_ref_str + '"]').value
            + document.querySelector('input[name="Tag' + curr_ref_str + '"]').value;
        const response_right = 
            document.querySelector('input[name="Valid2' + curr_ref_str + '"]').value
            + document.querySelector('input[name="Dirty2' + curr_ref_str + '"]').value
            + document.querySelector('input[name="Tag2' + curr_ref_str + '"]').value;
        if ( response_left != "" ) {
            this.disableCacheLineRight();
        } else if ( response_right != "" ) {
            this.disableCacheLineLeft();
        }
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
        if ( this.fixed || this.hasSeed ) {
            this.generateButton.textContent = $.i18n("msg_cachetable_redo");
        } else {
            this.generateButton.textContent = $.i18n("msg_cachetable_generate_another");
        }
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate Another",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.resetGeneration();
                if ( this.cacheOrg == twoWaySetAssociative ) {
                    this.displayNecessaryFields();
                }
                this.hidefeedback();
            }.bind(this),
            false
        );
        // put all buttons together
        this.buttonDiv.appendChild(this.generateButton);
        this.buttonDiv.appendChild(this.submitButton);
        this.buttonDiv.setAttribute("class", "aligned-tables");
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.buttonDiv);

        this.createHelpStatement();
        this.helpButton.click();
    }

    // submit the response
    submitResponse() {
        if (this.curr_ref != this.numRefs ) {
            this.checkCurrentAnswer();
            if (this.correct) {
                this.curr_ref += 1;
                if (this.curr_ref < this.numRefs) {
                    // call next
                    this.updateDisplayedTableBody()
                    this.generateAnswerNext();
                    this.updateReferenceTableAndAnswerTable();
                    if ( this.cacheOrg === twoWaySetAssociative ) {
                        this.displayNecessaryFields();
                    }
                } else {
                    // render feedback that congrats and this is all of the question
                    this.disableAnswerTableCurrentRow(this.curr_ref-1);
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
        this.generateAnswerInit()
        this.generateAnswerNext();
        this.updateReferenceTableAndAnswerTable();
    }
    
    // render the feedback div
    renderCacheTableFeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
        this.feedbackWrongAnswer = "";
    }

    // DEPRECATED
    // generateAnswerInit() {
    //     // initialize current reference number (int)
    //     this.curr_ref = 0;

    //     // generate hit miss (bool): hit = true; miss = false
    //     this.hit_miss_list = [];
    //     if (this.algorithm == algo_boost ) {
    //         this.num_boost_levels = 3;
    //         this.hit_boost_levels = [0.33, 0.67, 1];
    //         this.conf_boost_levels = [0.5, 0.75, 1];
    //         this.hit_boost_curr = Math.floor(Math.random()*3);
    //         this.conf_boost_curr = Math.floor(Math.random()*3);
    //     }
        
    //     // generate read write list (bool): write = true; read = false
    //     this.read_write_list = [];
        
    //     // this table keeps track of [valid bit (int 0/1), dirty bit (int 0/1), tag (str)] with index meaning line number
    //     // in 2-way set associative, it is [LRU bit, valid bit(1), dirty bit(1), tag(1), valid bit(2), dirty bit(2), tag(2)]
    //     // Remark: this table size is fixed
    //     this.curr_tagIndex_table = [];

    //     // this list keeps track of the answer in terms of [address, line# (int), dirty bit (int 0/1), tag (str)]
    //     // in 2-way set associative, it is [address, line#, LRU bit, valid bit(1), dirty bit(1), tag(1), valid bit(2), dirty bit(2), tag(2)]
    //     // Remark: this list size grows as there is growing number of steps
    //     this.answer_list = [];

    //     // initialize the variable that traces whether a response is correct
    //     this.correct = null;

    //     // this is the flag that indicates whether one practice is completed 
    //     this.completed = false;

    //     // add some random lines to the cache table
    //     this.addInitLines();
    // }

    generateAnswerInit() {
        this.generateAnswerParams();
        if ( this.fixed ) {
            this.readInitLines();
        } else {
            this.genRefBoostInit();
        }
        for (let i = 0; i < this.numRows; i++) {
            this.updateDisplayedTableBodyRow(i);
        }
    }

    generateAnswerParams() {
        // initialize current tagIndex table
        this.curr_tagIndex_table = [];

        // generate read write list (bool): write = true; read = false
        this.read_write_list = [];

        // this list keeps track of the answer in terms of [address, line# (int), dirty bit (int 0/1), tag (str)]
        // in 2-way set associative, it is [address, line#, LRU bit, valid bit(1), dirty bit(1), tag(1), valid bit(2), dirty bit(2), tag(2)]
        // Remark: this list size grows as there is growing number of steps
        this.answer_list = [];

        // initialize the variable that traces whether a response is correct
        this.correct = null;

        // this is the flag that indicates whether one practice is completed 
        this.completed = false;

        // initialize hit miss list
        this.hit_miss_list = [];


        this.curr_ref = 0;
        // initialize for different cache org
        if (this.cacheOrg === directMapped) {
            this.lines_in_set = 1;
        } else if (this.cacheOrg === twoWaySetAssociative){
            this.lines_in_set = 2;
        }

        // we would use implicit parameters: num_ref, lines_in_set, offsetBits, tagBits, chance_hit, hit_incr, chance_conf, conf_incr
        this.numRows = 1 << this.indexBits;
        this.curr_hit_chance = this.chance_hit;
        this.hmFlag = false;
        this.curr_conflict_chance = this.chance_conf;
        this.conflictFlag = false;
        this.preconflictFlag = false;
        this.curr_ref = 0;
    }
    readInitLines() {
        // set every line of the table to be empty
        for (let i = 0; i < this.numRows; i++) {
            if ( this.cacheOrg == directMapped ) {
                this.curr_tagIndex_table.push([[0, 0, ""],0]);
            } else {
                this.curr_tagIndex_table.push([[0, 0, ""],[0, 0, "",],0]);
            }
        }
        //
        for (const line of this.cacheTableInit) {
            const index = line["index"];
            if ( this.cacheOrg == directMapped ) {
                var v = 0, d = 0, tag = "";
                if (line["valid"] != undefined) {
                    v = eval(line["valid"]);
                }
                if (line["dirty"] != undefined) {
                    d = eval(line["dirty"]);
                }
                if (line["tag"] != undefined) {
                    tag = line["tag"];
                }
                this.curr_tagIndex_table[ index ][ 0 ][ 0 ] = v;
                this.curr_tagIndex_table[ index ][ 0 ][ 1 ] = d;
                this.curr_tagIndex_table[ index ][ 0 ][ 2 ] = tag;
            } else {
                var lru=0, v1=0, d1=0, tag1="", v2=0, d2=0, tag2="";
                if (line["lru"] != undefined) {
                    lru = eval(line["lru"]);
                }
                if (line["left"] != undefined) {
                    const leftLine = line["left"];
                    if (leftLine["valid"] != undefined) {
                        v1 = eval(leftLine["valid"]);
                    }
                    if (leftLine["dirty"] != undefined) {
                        d1 = eval(leftLine["dirty"]);
                    }
                    if (leftLine["tag"] != undefined) {
                        tag1 = leftLine["tag"];
                    }
                }
                if (line["right"] != undefined) {
                    const rightLine = line["right"];
                    if (rightLine["valid"] != undefined) {
                        v2 = eval(rightLine["valid"]);
                    }
                    if (rightLine["dirty"] != undefined) {
                        d2 = eval(rightLine["dirty"]);
                    }
                    if (rightLine["tag"] != undefined) {
                        tag2 = rightLine["tag"];
                    }
                }

                this.curr_tagIndex_table[ index ][ 2 ] = lru;
                this.curr_tagIndex_table[ index ][ 0 ][ 0 ] = v1;
                this.curr_tagIndex_table[ index ][ 0 ][ 1 ] = d1;
                this.curr_tagIndex_table[ index ][ 0 ][ 2 ] = tag1;
                this.curr_tagIndex_table[ index ][ 1 ][ 0 ] = v2;
                this.curr_tagIndex_table[ index ][ 1 ][ 1 ] = d2;
                this.curr_tagIndex_table[ index ][ 1 ][ 2 ] = tag2;
            }
            
        }
    }

    // DEPRECATED
    // addRandomInitLines() {
    //     if (this.cacheOrg === directMapped ) {
    //         var valid_init, dirty_init, tag_init, currRand;
    //         for (let i = 0; i < this.numRows; i++) {
    //             currRand = Math.random();
    //             if (currRand < this.initValidRate) {
    //                 valid_init = 1;
    //                 tag_init = this.generateTag();
    //                 dirty_init = this.getRandomBit();
    //             } else {
    //                 valid_init = 0;
    //                 dirty_init = 0;
    //                 tag_init = "";
    //                 if ( currRand > 0.81 ) {
    //                     tag_init = this.generateTag();
    //                     if ( currRand > 0.9 ) {
    //                         dirty_init = 1;
    //                     }
    //                 }
    //             }
    //             this.curr_tagIndex_table.push([valid_init, dirty_init, tag_init]);
    //         }
    //     } else {
    //         var lru_init, valid_init1, dirty_init1, tag_init1;
    //         var valid_init2, dirty_init2, tag_init2, currRand1, currRand2;
    //         for (let i = 0; i < this.numRows; i++) {
    //             lru_init = this.getRandomBit();
    //             currRand1 = Math.random();
    //             if (currRand1 < this.initValidRate) {
    //                 valid_init1 = 1;
    //                 tag_init1 = this.generateTag();
    //                 dirty_init1 = this.getRandomBit();
    //             } else {
    //                 valid_init1 = 0;
    //                 dirty_init1 = 0;
    //                 tag_init1 = "";
    //                 if ( currRand1 > 0.81 ) {
    //                     tag_init1 = this.generateTag();
    //                     if ( currRand1 > 0.9 ) {
    //                         dirty_init1 = 1;
    //                     }
    //                 }
    //             }
    //             currRand2 = Math.random();
    //             if (currRand2 < this.initValidRate) {
    //                 valid_init2 = 1;
    //                 tag_init2 = this.generateTag();
    //                 dirty_init2 = this.getRandomBit();
    //             } else {
    //                 valid_init2 = 0;
    //                 dirty_init2 = 0;
    //                 tag_init2 = "";
    //                 if ( currRand2 > 0.81 ) {
    //                     tag_init2 = this.generateTag();
    //                     if ( currRand2 > 0.9 ) {
    //                         dirty_init2 = 1;
    //                     }
    //                 }
    //             }
    //             this.curr_tagIndex_table.push([lru_init, valid_init1, dirty_init1, tag_init1,
    //                 valid_init2, dirty_init2, tag_init2]);
    //         }
    //     }
    // }

    generateAnswerNext() {
        if ( this.fixed ) {
            this.loadNextAnswer();
        } else {
            this.genRefBoostNext();
        }
    }

    loadNextAnswer() {
        const curr_ref_num = this.curr_ref;
        const current_reference = this.referenceList[ curr_ref_num ];
        const curr_address = current_reference[ 0 ];
        const currtagIndex = curr_address.slice(0, this.indexBits + this.tagBits);
        const curr_RW = current_reference[ 1 ] == "W" ? true : false;
        const curr_idx_b = currtagIndex.slice(-this.indexBits);
        const curr_idx_d = this.binary2decimal(curr_idx_b);
        const curr_tag_b = currtagIndex.slice(0, this.tagBits);
        let curr_hm;
        if ( this.cacheOrg == directMapped ) {
            const prev_valid = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 0 ];
            const prev_dirty = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 1 ];
            const prev_tag = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 2 ];
            let curr_d;
            // determine whether hit or miss
            if ( prev_valid == 0 ) {
                curr_hm = false;
            } else if ( prev_tag != curr_tag_b ) {
                curr_hm = false;
            } else {
                curr_hm = true;
            }
            // determine the dirty bit
            curr_d = this.calculateDirtyBit(prev_valid, curr_RW, curr_hm, prev_dirty);
            this.answer_list.push([curr_address, curr_idx_d, 1, curr_d, curr_tag_b]);
            // console.log( prev_valid );
            // console.log( curr_RW );
            // console.log( curr_hm );
            // console.log( prev_dirty );
            // console.log(this.answer_list[ this.curr_ref ] );
            this.curr_tagIndex_table[curr_idx_d][0][0] = 1; // change valid bit to 1
            this.curr_tagIndex_table[curr_idx_d][0][1] = curr_d; // change dirty bit to corresponding value
            this.curr_tagIndex_table[curr_idx_d][0][2] = curr_tag_b; // change tag to corresponding string
        } else {
            // const prev_lru = this.curr_tagIndex_table[ curr_idx_d ][ 0 ];
            // const prev_valid1 = this.curr_tagIndex_table[ curr_idx_d ][ 1 ];
            // const prev_dirty1 = this.curr_tagIndex_table[ curr_idx_d ][ 2 ];
            // const prev_tag1 = this.curr_tagIndex_table[ curr_idx_d ][ 3 ];
            // const prev_valid2 = this.curr_tagIndex_table[ curr_idx_d ][ 4 ];
            // const prev_dirty2 = this.curr_tagIndex_table[ curr_idx_d ][ 5 ];
            // const prev_tag2 = this.curr_tagIndex_table[ curr_idx_d ][ 6 ];
            const prev_lru = this.curr_tagIndex_table[ curr_idx_d ][ 2 ];
            const prev_valid1 = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 0 ];
            const prev_dirty1 = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 1 ];
            const prev_tag1 = this.curr_tagIndex_table[ curr_idx_d ][ 0 ][ 2 ];
            const prev_valid2 = this.curr_tagIndex_table[ curr_idx_d ][ 1 ][ 0 ];
            const prev_dirty2 = this.curr_tagIndex_table[ curr_idx_d ][ 1 ][ 1 ];
            const prev_tag2 = this.curr_tagIndex_table[ curr_idx_d ][ 1 ][ 2 ];
            let curr_lru, ans_valid_1, ans_dirty_1, ans_tag_1, ans_valid_2, ans_dirty_2, ans_tag_2;

            if ( prev_valid1 && prev_tag1 == curr_tag_b ) {
                curr_hm = true;
            } else if ( prev_valid2 && prev_tag2 == curr_tag_b) {
                curr_hm = true;
            } else {
                curr_hm = false;
            }
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
                    this.calculateDirtyBit(prev_valid1, curr_RW, 
                    curr_hm, prev_dirty1);
                ans_tag_1 = curr_tag_b;
            } else {
                ans_valid_1 = prev_valid1;
                ans_dirty_1 = prev_dirty1;
                ans_tag_1 = prev_tag1;

                ans_valid_2 = 1;
                ans_dirty_2 = 
                    this.calculateDirtyBit(prev_valid2, curr_RW, 
                    curr_hm, prev_dirty2);
                ans_tag_2 = curr_tag_b;
            }

            this.answer_list.push([curr_address, curr_idx_d, 
                ans_valid_1, ans_dirty_1, ans_tag_1, ans_valid_2, ans_dirty_2, ans_tag_2, curr_lru]);
    
            // this.curr_tagIndex_table[curr_idx_d][0] = curr_lru; 
            // this.curr_tagIndex_table[curr_idx_d][1] = ans_valid_1; 
            // this.curr_tagIndex_table[curr_idx_d][2] = ans_dirty_1; 
            // this.curr_tagIndex_table[curr_idx_d][3] = ans_tag_1; 
            // this.curr_tagIndex_table[curr_idx_d][4] = ans_valid_2; 
            // this.curr_tagIndex_table[curr_idx_d][5] = ans_dirty_2; 
            // this.curr_tagIndex_table[curr_idx_d][6] = ans_tag_2; 
            this.curr_tagIndex_table[curr_idx_d][2] = curr_lru; 
            this.curr_tagIndex_table[curr_idx_d][0][0] = ans_valid_1; 
            this.curr_tagIndex_table[curr_idx_d][0][1] = ans_dirty_1; 
            this.curr_tagIndex_table[curr_idx_d][0][2] = ans_tag_1; 
            this.curr_tagIndex_table[curr_idx_d][1][0] = ans_valid_2; 
            this.curr_tagIndex_table[curr_idx_d][1][1] = ans_dirty_2; 
            this.curr_tagIndex_table[curr_idx_d][1][2] = ans_tag_2; 
        }
        this.read_write_list.push(curr_RW);
        this.hit_miss_list.push(curr_hm);
    }

    // DEPRECATED
    // generateRandomAnswerNext() {

    //     // determine the read/ write for this step - always half half
    //     // write = true; read = false
    //     const curr_rw = this.getRandomBit() === 0 ? false : true;
    //     this.read_write_list.push(curr_rw);

    //     // generate current tagIndex
    //     var currtagIndex;
    //     let valid_tagIndex_list = []; 
    //     if ( this.cacheOrg === directMapped ) {

    //         for (var j = 0; j < this.curr_tagIndex_table.length; j++) { // collect all current valid tagIndices
    //             if (this.curr_tagIndex_table[j][0] == 1) {
    //                 valid_tagIndex_list.push(this.curr_tagIndex_table[j][2] + this.toBinary(j, this.indexBits));
    //             }
    //         }
    //     } else {
    //         for (var j = 0; j < this.curr_tagIndex_table.length; j++) { // collect all current valid tagIndices
    //             if (this.curr_tagIndex_table[j][1] == 1) {
    //                 valid_tagIndex_list.push(this.curr_tagIndex_table[j][3] + this.toBinary(j, this.indexBits));
    //             }
    //             if (this.curr_tagIndex_table[j][4] == 1) {
    //                 valid_tagIndex_list.push(this.curr_tagIndex_table[j][6] + this.toBinary(j, this.indexBits));
    //             }
    //         }
    //     }
    //     // determine the hit/ miss answer for this step
    //     var curr_hm; // hit = true; miss = false
    //     var conf_miss = false;
    //     if ( this.algorithm == algo_hitNmiss ) {
    //         if (valid_tagIndex_list.length == 0) { // when there is no valid line, it is always miss
    //             curr_hm = false;
    //         } else if (this.curr_ref <= 1) { // second half half
    //             curr_hm = this.getRandomBit() === 0 ? true : false;
    //         } else {
    //             // if previous two hits, miss this time
    //             if (this.hit_miss_list[this.curr_ref - 2] && this.hit_miss_list[this.curr_ref - 1]) {
    //                 curr_hm = false;
    //             } else { // otherwise half half
    //                 curr_hm = this.getRandomBit() === 0 ? true : false;
    //             }
    //         }
    //     } else {
            
    //         if (valid_tagIndex_list.length == 0) { // when there is no valid line, it is always miss
    //             curr_hm = false;
    //         } else {
    //             curr_hm = Math.random() < this.hit_boost_levels[ this.hit_boost_curr ] ? true : false;
    //             if ( curr_hm ) {
    //                 this.hit_boost_curr = 0;
    //             } else {
    //                 this.hit_boost_curr ++;
    //                 conf_miss = Math.random() < this.conf_boost_levels[ this.conf_boost_curr ] ? true : false;
    //                 if ( conf_miss ) {
    //                     this.conf_boost_curr = 0;
    //                 } else {
    //                     this.conf_boost_curr ++;
    //                 }
    //             }
    //         }
    //     }
    //     this.hit_miss_list.push(curr_hm);

        
    //     // console.log(valid_tagIndex_list)
    //     if (curr_hm) {
    //         // if it is a hit, pick a valid tagIndex to proceed
    //         let currRand = Math.floor(Math.random() * valid_tagIndex_list.length);
    //         currtagIndex = valid_tagIndex_list[currRand];
    //     } else {
    //         // if it is a miss, then generate a new tagIndex
    //         if ( this.algorithm == algo_hitNmiss || this.cacheOrg == twoWaySetAssociative 
    //             || valid_tagIndex_list.length == 0 || !conf_miss ) {
    //             currtagIndex = this.generateTagIndex();
    //             if (valid_tagIndex_list.length > 0 ) {
    //                 while (valid_tagIndex_list.includes(currtagIndex)) {
    //                     currtagIndex = this.generateTagIndex();
    //                 }
    //             }
    //         } else {
    //             const evicted_entry = valid_tagIndex_list[ Math.floor( Math.random() * valid_tagIndex_list.length)  ];
    //             const evicted_entry_index = evicted_entry.slice(0, this.tagBits);
    //             const evicted_entry_tag = evicted_entry.slice(-this.indexBits);
    //             var new_tag = this.generateTag();
    //             while(new_tag == evicted_entry_tag) {
    //                 new_tag = this.generateTag();
    //             }
    //             currtagIndex = new_tag + evicted_entry_index;
    //         }
    //     }

    //     if ( this.cacheOrg === directMapped ) {

    //         const curr_tag_b = currtagIndex.slice(0, this.tagBits);
    //         const curr_idx_b = currtagIndex.slice(-this.indexBits);
    //         const curr_idx_d = this.binary2decimal(curr_idx_b);
    //         const curr_address = currtagIndex + this.generateOffset();
    //         const curr_valid = this.curr_tagIndex_table[curr_idx_d][0];
    //         // generate current dirty bit
    //         const curr_d = this.calculateDirtyBit(curr_valid, curr_rw, curr_hm, this.curr_tagIndex_table[curr_idx_d][1]);
            
    //         // reflect the changes in answer_list and curr_tagIndex_table
    //         this.answer_list.push([curr_address, curr_idx_d, curr_d, curr_tag_b]);
    //         this.curr_tagIndex_table[curr_idx_d][0] = 1; // change valid bit to 1
    //         this.curr_tagIndex_table[curr_idx_d][1] = curr_d; // change dirty bit to corresponding value
    //         this.curr_tagIndex_table[curr_idx_d][2] = curr_tag_b; // change tag to corresponding string

    //     } else {

    //         const curr_idx_b = currtagIndex.slice(-this.indexBits);
    //         const curr_idx_d = this.binary2decimal(curr_idx_b);
    //         const curr_tag_b = currtagIndex.slice(0, this.tagBits);
    //         const curr_address = currtagIndex + this.generateOffset();
    //         // previous lru
    //         const prev_lru = this.curr_tagIndex_table[curr_idx_d][0];
    //         const prev_valid1 = this.curr_tagIndex_table[curr_idx_d][1];
    //         const prev_dirty1 = this.curr_tagIndex_table[curr_idx_d][2];
    //         const prev_tag1 = this.curr_tagIndex_table[curr_idx_d][3];
    //         const prev_valid2 = this.curr_tagIndex_table[curr_idx_d][4];
    //         const prev_dirty2 = this.curr_tagIndex_table[curr_idx_d][5];
    //         const prev_tag2 = this.curr_tagIndex_table[curr_idx_d][6];
    //         var curr_lru = null;
    //         var ans_tag_1 = null;
    //         var ans_tag_2 = null;
    //         var ans_valid_1 = null;
    //         var ans_valid_2 = null;
    //         var ans_dirty_1 = null;
    //         var ans_dirty_2 = null;
    //         if ( curr_hm ) {
    //             if ( curr_tag_b === prev_tag1 ) {
    //                 curr_lru = 1;
    //             } else {
    //                 curr_lru = 0;
    //             }
    //         } else {
    //             // check if there is no available space
    //             if ( prev_valid1 && prev_valid2 ) {
    //                 if ( prev_lru === 1 ) {
    //                     curr_lru = 0;
    //                 } else {
    //                     curr_lru = 1;
    //                 }
    //             } else { // occupy the available one
    //                 // if both available, occupy the one previous LRU points to
    //                 if ( prev_valid1 == prev_valid2 ) {
    //                     curr_lru = 1 - prev_lru;
    //                 } else if ( prev_valid1 ) { // otherwise, occupy the one with valid bit 0
    //                     curr_lru = 0;
    //                 } else {
    //                     curr_lru = 1;
    //                 }
    //             }
    //         }

    //         // determine the answer based on current LRU
    //         if (curr_lru == 1) {
    //             ans_valid_2 = prev_valid2;
    //             ans_dirty_2 = prev_dirty2;
    //             ans_tag_2 = prev_tag2;

    //             ans_valid_1 = 1;
    //             ans_dirty_1 = 
    //                 this.calculateDirtyBit(prev_valid1, curr_rw, 
    //                 curr_hm, prev_dirty1);
    //             ans_tag_1 = curr_tag_b;
    //         } else {
    //             ans_valid_1 = prev_valid1;
    //             ans_dirty_1 = prev_dirty1;
    //             ans_tag_1 = prev_tag1;

    //             ans_valid_2 = 1;
    //             ans_dirty_2 = 
    //                 this.calculateDirtyBit(prev_valid2, curr_rw, 
    //                 curr_hm, prev_dirty2);
    //             ans_tag_2 = curr_tag_b;
    //         }
            
    //         // reflect the changes in answer_list and curr_tagIndex_table
    //         this.answer_list.push([curr_address, curr_idx_d, curr_lru,
    //         ans_valid_1, ans_dirty_1, ans_tag_1, ans_valid_2, ans_dirty_2, ans_tag_2]);

    //         this.curr_tagIndex_table[curr_idx_d][0] = curr_lru; 
    //         this.curr_tagIndex_table[curr_idx_d][1] = ans_valid_1; 
    //         this.curr_tagIndex_table[curr_idx_d][2] = ans_dirty_1; 
    //         this.curr_tagIndex_table[curr_idx_d][3] = ans_tag_1; 
    //         this.curr_tagIndex_table[curr_idx_d][4] = ans_valid_2; 
    //         this.curr_tagIndex_table[curr_idx_d][5] = ans_dirty_2; 
    //         this.curr_tagIndex_table[curr_idx_d][6] = ans_tag_2; 
    //     }

    // }

    genRefBoostInit() {
        // curr_index_table for this algorithm
        // structure of current tagIndex table
        // [[Vi, Di, "Tagi"], LRU]: i < this.line_in_set
        // the table is initialized with initial values and noises

        var valid_line = [];
        var tag_init = "";
        for (let i = 0; i < this.numRows; i++) {
            this.curr_tagIndex_table.push([]);
            valid_line = [];
            for (let j = 0; j < this.lines_in_set; j++) {
                let dirty_init = 0, tag_init = "";
                if (Math.random() < this.initValidRate) {
                    valid_line.push(j);
                    tag_init = this.generateTag();
                    if (j==1) {   
                        while (tag_init == this.curr_tagIndex_table[i][this.lines_in_set - 1 - j][2]) {
                            tag_init = this.generateTag();
                        }
                    }
                    this.curr_tagIndex_table[i].push([1, this.getRandomBit(), tag_init]);
                } else {
                    dirty_init = 0;
                    tag_init = "";
                    if ( Math.random() > 0.81 ) {
                        tag_init = this.generateTag();
                        if (j == 1) {
                            while (tag_init == this.curr_tagIndex_table[i][this.lines_in_set - 1 - j][2]) {
                                tag_init = this.generateTag();
                            }
                        }
                        if ( Math.random() > 0.9 ) {
                            dirty_init = 1;
                        }
                    }
                    this.curr_tagIndex_table[i].push([0, dirty_init, tag_init]);
                }
            }
            if (valid_line.length === 0) {
                this.curr_tagIndex_table[i].push(0);
            } else if (valid_line.length === this.lines_in_set) {
                this.curr_tagIndex_table[i].push(Math.floor(this.lines_in_set * Math.random()));
            } else {
                this.curr_tagIndex_table[i].push(this.lines_in_set - 1 - valid_line[0]);
            }
        }


    }

    genRefBoostNext() {
        // collect valid information
        let validIndex = [];
        let validFullIndex = [];
        for (let i = 0; i < this.numRows; i++) {
            let full_valid = 0;
            for (let j = 0; j < this.lines_in_set; j++) {
                if (this.curr_tagIndex_table[i][j][0] == 1) {
                    full_valid += 1;
                }
            }
            if (full_valid == this.lines_in_set) {
                validFullIndex.push(i);
            }
            if (full_valid > 0) {
                validIndex.push(i);
            }
        }
        // determine whether we should hit/miss conflict/non-conflict
        if (validIndex.length === 0) {
            // if the cache table is empty, then we must have a non-conflict miss
            this.hmFlag = false;
            this.conflictFlag = false;
            this.curr_conflict_chance = this.chance_conf;
            this.curr_hit_chance = this.chance_hit;
        } else {
            if (this.preconflictFlag) {
                // if we have a pending delayed conflict miss, 
                // we perform the conflict miss for this turn
                this.hmFlag = false;
                this.conflictFlag = true;
                this.curr_hit_chance += this.hit_incr;
            } else {
                if (this.hmFlag) {
                    // if previous is a hit, then we reduce the hit chance
                    this.curr_hit_chance = this.chance_hit;
                } else {
                    this.curr_hit_chance += this.hit_incr;
                    if (this.conflictFlag) {
                        // if previous miss is a conflict miss, reset the conflict miss chance
                        this.curr_conflict_chance = this.chance_conf;
                    } else {
                        // if previous miss is a non-conflict miss, boost the conflict miss chance
                        this.curr_conflict_chance += this.conf_incr;
                    }
                }

                // draw to determine whether current one is a hit, or miss
                if (Math.random() < this.curr_hit_chance) {
                    this.hmFlag = true;
                    this.conflictFlag = false;
                } else {
                    // if it is a miss, then we further determine whether this is a conflict miss or non-conflict miss
                    this.hmFlag = false;
                    this.conflictFlag = Math.random() < this.curr_conflict_chance;
                }
            }
        }
        // create address based on hit/miss
        let currIndex = null;
        let currTag = null;
        let recentlyUsedLine = null;
        if (this.hmFlag) {
            // if it's a hit, select an valid index and then select a valid line
            currIndex = validIndex[Math.floor(validIndex.length * Math.random())];
            if (this.lines_in_set == 1) {
                recentlyUsedLine = 0;
            } else {
                recentlyUsedLine = Math.random() < 0.5 ? 0 : 1;
            }
            if (1- this.curr_tagIndex_table[currIndex][recentlyUsedLine][0]) {
                recentlyUsedLine = this.lines_in_set - 1 - recentlyUsedLine;
            }
            currTag = this.curr_tagIndex_table[currIndex][recentlyUsedLine][2];
            this.conflictFlag = false;
            this.preconflictFlag = false;
        } else {
            if (this.conflictFlag) {
                if (validFullIndex.length) {
                    // if it is a conflict miss, we need to make a conflict happen
                    currIndex = validFullIndex[Math.floor(validFullIndex.length * Math.random())];
                    recentlyUsedLine = this.curr_tagIndex_table[currIndex][this.lines_in_set];
                    let alreadyUsed = true;
                    do {
                        currTag = this.generateTag();
                        alreadyUsed = false;
                        for (let i = 0; i < this.lines_in_set; i++) {
                            alreadyUsed = alreadyUsed || (this.curr_tagIndex_table[currIndex][i][2] === currTag);
                        }
                    } while (alreadyUsed);
                    this.preconflictFlag = false;
                } else {
                    // if a conflict is not possible, fill one set and delay the conflict
                    currIndex = validIndex[Math.floor(validIndex.length * Math.random())];
                    recentlyUsedLine = this.curr_tagIndex_table[currIndex][this.lines_in_set];
                    do {
                        currTag = this.generateTag();
                    } while (currTag === this.curr_tagIndex_table[currIndex][this.lines_in_set - recentlyUsedLine]);
                    this.preconflictFlag = true;
                }
            } else {
                // select arbitrary set and make a miss (small chance being a conflict miss)
                currIndex = Math.floor(this.numRows * Math.random());
                recentlyUsedLine = this.curr_tagIndex_table[currIndex][this.lines_in_set];
                if (this.curr_tagIndex_table[currIndex][recentlyUsedLine][0]) {
                    this.conflictFlag = true;
                }
                let alreadyUsed = true;
                do {
                    currTag = this.generateTag();
                    alreadyUsed = false;
                    for (let i = 0; i < this.lines_in_set; i++) {
                        alreadyUsed = alreadyUsed || (this.curr_tagIndex_table[currIndex][i][2] === currTag);
                    }
                } while (alreadyUsed);
                this.preconflictFlag = false;
            }
        }
        // update hit miss list
        this.hit_miss_list.push(this.hmFlag);
        // tidy up the address creation
        const currIndex_str = this.toBinary(currIndex, this.indexBits);

        let currLRU = this.lines_in_set - 1 - recentlyUsedLine;
        let currRW = (Math.random() < 0.5);
        let currDirty = this.calculateDirtyBit2(currIndex, recentlyUsedLine, this.hmFlag, currRW);

        // update tagIndex table
        this.curr_tagIndex_table[currIndex][this.lines_in_set] = currLRU;
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][0] = 1;
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][1] = currDirty;
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][2] = currTag;
        // update reference table aka answerlist
        const currAddress = currTag + currIndex_str + this.generateOffset();
        let currAnswer = [currAddress, currIndex];
        for (let i = 0; i< this.lines_in_set; i++){
            currAnswer.push(...this.curr_tagIndex_table[currIndex][i]);
        }
        // append the LRU
        currAnswer.push(this.curr_tagIndex_table[currIndex][this.lines_in_set])
        this.answer_list.push(currAnswer);
        this.read_write_list.push(currRW);
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
                if (PrevDirtyBit === 1 && isValid === 1) {
                    return 1;
                } else {
                    return 0;
                }
            } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
                return 0;
            }
        }
    }

    calculateDirtyBit2(currIndex, recentlyUsedLine, curr_hm, curr_rw) {
        return this.calculateDirtyBit(this.curr_tagIndex_table[currIndex][recentlyUsedLine][0], curr_rw, curr_hm, this.curr_tagIndex_table[currIndex][recentlyUsedLine][1]);
    }

    // DEPRECATED
    // calculateDirtyBit(isValid, isWrite, isHit, PrevDirtyBit) {
    //     if (isWrite) { // if it is a write request, always set dirty bit to 1
    //         return 1;
    //     } else { // if it is a read request
    //         if (isHit) { // then if it is a hit, match current dirty bit state to that of the previous content
    //             if (PrevDirtyBit == 1 && isValid == 1) {
    //                 return 1;
    //             } else {
    //                 return 0;
    //             }
    //         } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
    //             return 0;
    //         }
    //     }
    // }

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
        return this.generateAddress(this.tagBits);
    }

    generateTagIndex() {
        return this.generateAddress(this.tagBits + this.indexBits);
    }

    generateOffset() {
        return this.generateAddress(this.offsetBits);
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
    
    // check if the answer is correct.
    // print out corresponding feedback if there is a mistake.
    checkCurrentAnswer() {
        this.correct = false;
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
            if ( curr_answers[ 1 ].toString() != response_index ) {
                this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_index");
                return;
            }

            if ( this.hit_miss_list[ curr_ref ] != response_hit_miss  ) {
                this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_HM");
                return;
            }
            // in 2-way set associative, we need to check 4 extra input fields
            if ( this.cacheOrg === twoWaySetAssociative ) {
                const response_lru = 
                    document.querySelector('input[name="LRU' + curr_ref_str + '"]').value;
                const response_dirty2 =
                    document.querySelector('input[name="Dirty2' + curr_ref_str + '"]').value;
                const response_valid2 =
                    document.querySelector('input[name="Valid2' + curr_ref_str + '"]').value;
                const response_tag2 =
                    document.querySelector('input[name="Tag2' + curr_ref_str + '"]').value;
                if ( curr_answers[ 8 ].toString() != response_lru ) {
                    this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_LRU");
                    return;
                }
                if ( response_lru == 1 ) {
                    if ( response_valid + response_dirty + response_tag == "") {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_line");
                        return;
                    }
                    if ( curr_answers[ 2 ].toString() != response_valid ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_valid");
                        return;
                    }
                    if ( curr_answers[ 3 ].toString() != response_dirty ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_dirty");
                        return;
                    }
                    if ( curr_answers[ 4 ].toString() != response_tag ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_tag");
                        return;
                    }     
                } else {
                    if ( response_valid2 + response_dirty2 + response_tag2 == "") {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_line");
                        return;
                    }
                    if ( curr_answers[ 5 ].toString() != response_valid2 ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_valid");
                        return;
                    }
                    if ( curr_answers[ 6 ].toString() != response_dirty2 ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_dirty");
                        return;
                    }
                    if ( curr_answers[ 7 ].toString() != response_tag2 ) {
                        this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_tag");
                        return;
                    }       
                }

            } else {
                if ( response_valid != "1" ) {
                    this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_valid");
                    return;
                }
                if ( curr_answers[ 3 ].toString() != response_dirty ) {
                    this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_dirty");
                    return;
                }
                if ( curr_answers[ 4 ].toString() != response_tag ) {
                    this.feedbackWrongAnswer = $.i18n("msg_cachetable_wrong_tag");
                    return;
                }       
            }     
            this.correct = true;
        } catch (error) {
            this.feedbackWrongAnswer = $.i18n("msg_cachetable_incomplete_answer");
            this.correct = false;
            console.log(error);
            console.log("HM" + curr_ref_str);
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
            feedback_html += "<div>" + this.feedbackWrongAnswer + "</div>";
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
