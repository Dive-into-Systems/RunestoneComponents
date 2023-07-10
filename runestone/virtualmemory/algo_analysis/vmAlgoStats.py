import random
'''
This function represents values in binary form with certain number of bits (length)
'''
def toBinary(num, length):
    toStr = bin(num)[2:]
    if (len(toStr) < length):
        leading_zeros = ""
        for i in range(len(toStr), length):
            leading_zeros += "0"
        toStr = leading_zeros + toStr
    return toStr

'''
'''
def generateBinaryStr(bits):
    answer = ""
    for i in range(bits):
        answer += random.choice(["1", "0"])
    return answer

'''
the RandAlgo class keeps track of four dimensions of an address-generating algorithm:
1. miss type (conflict miss/non conflict miss)
2. hit/miss ratio
3. indices coverage (number of unique indices generated over all possible indices)
4. address variety (number of unique addresses over the size of one address list)
'''
class vmAlgo:
    def __init__(self):
        
        self.name = "" # name of algorithm
        self.addresses = [] # list of generated addresses in one run
        self.num_refs = None # length of the list of generated addresses in one run
        self.index_bits = None # number of bits for index
        self.num_pages = None # number of entries in cache structure
        self.num_frames = None
        
        self.hit_miss_list = [] # store hit/miss history
        self.num_entries = None
        self.setAssoc = 1

        self.cold_start_miss = 0
        self.conflict_miss = 0
        self.hit_miss_ratio = None
        self.indices_coverage = None
        self.address_variety = None
        
        self.range_frames = None
        
        self.currentVmTable = []
        for i in range(self.num_pages):
            self.currentVmTable.append([0, -1])
    
    # print out all info in current test run
    def __str__(self):
        toString = ""
        toString += ("There are in total " + str(len(self.addresses)) + " addresses: \n")
        for i in range(len(self.addresses)):
            toString += (str(self.addresses[i]) + "\n")
        toString += ("Hit miss ratio " + str(self.hit_miss_ratio) + "\n")
        toString += ("Address variety" + str(self.address_variety) + "\n")
        toString += ("Indices coverage" + str(self.indices_coverage) + "\n")
        toString += ("Number of conflict miss is " + str(self.conflict_miss) + "\n")
        toString += ("Number of non conflict miss is " + str(self.cold_start_miss) + "\n")
        return toString        
                

    # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
    def updateHitPageFaultList_missType(self):
        for currPage in self.addresses:
            currPage_binary = toBinary(currPage, self.index_bits)
            currFrame, evictedPage, curr_hm = self.replacementFIFO(currPage)

            if (evictedPage != -1):
                self.currentVmTable[evictedPage][0] = 0
                self.currentVmTable[evictedPage][1] = -1
        self.currentVmTable[currPage][0] = 1
        self.currentVmTable[currPage][1] = currFrame

        self.hit_miss_list.push(curr_hm);

    
    def findPage(self, currPage) {
        for (let i = 0; i < this.replacementStruct.length; i++) {
            if (currPage == this.replacementStruct[i][1]) {
                return i;
            }
        }
        return -1;
    }
    
    def replacementFIFO(self, currPage) {
        idx = this.findPage(currPage);
        let ret;
        if (idx == -1) {
            if (this.replacementStruct.length < this.numFrames) {
                this.replacementStruct.push([this.replacementStruct.length, currPage]);
                this.invalid.remove(this.binary2decimal(currPage));
                ret = [this.replacementStruct.length - 1, -1, false];
            } else {
                let curr = this.replacementStruct.shift();
                let currFrame = curr[0];
                let evictedPage = curr[1];
                this.invalid.add(this.binary2decimal(evictedPage));
                this.invalid.remove(this.binary2decimal(currPage));
                this.replacementStruct.push([currFrame, currPage]);
                ret = [currFrame, evictedPage, false];
            }   
        } else {
            ret = [this.replacementStruct[idx][0], -1, true];
        }
        // console.log(this.replacementStruct);
        return ret;
    }
    '''
    calculate the hit miss ratio 
    by dividing the number of hit over the total times of accessing the cache
    '''
    def calculateHitMissRatio(self):
        hits = 0
        for i in self.hit_miss_list:
            if i: 
                hits += 1
        self.hit_miss_ratio = hits/self.num_refs
        # print("The hit miss ratio is " + str(self.hit_miss_ratio))
    
    '''
    calculate indices coverage
    by divding the number of unique indices over the size of the cache
    '''
    def calculateIndicesCoverage(self):
        uniqueIndices = set()
        for address in self.addresses:
            if address[1] not in uniqueIndices:
                uniqueIndices.add(address[1])
        self.indices_coverage = len(uniqueIndices)/self.num_rows
        if self.address_variety > 1:
            print(uniqueIndices)
            print(self.addresses)
            raise Exception("indice coverage cannot be larger than 1")
        # print("The coverage of indices (uniqueIndices / numRows) is " + str(self.indices_coverage))
    
    '''
    calculate address variety
    by dividing the number of unique tag_index combination over the size of address list
    '''
    def calculateAddressVariety(self):
        uniqueTagIndex = set()
        for address in self.addresses:
            if (address[0] + address[1]) not in uniqueTagIndex:
                uniqueTagIndex.add(address[0] + address[1])
        self.address_variety = len(uniqueTagIndex)/self.num_refs
        if self.address_variety > 1:
            print(uniqueTagIndex)
            print(self.addresses)
            raise Exception("address variety cannot be larger than 1")
        # print("The address variety ratio (uniqueTagIndex / numRefs) is " + str(self.address_variety))
    
    def calcAll(self):
        self.updateHitMissList_missType()
        self.calculateHitMissRatio()
        self.calculateAddressVariety()
        self.calculateIndicesCoverage()