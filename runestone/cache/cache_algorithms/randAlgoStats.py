'''
cache behavoirs to keep track on potentially:
    (1) cold start miss
    (2) conflict miss: related to number of rows
    (3) miss / hit ratio
    (4) coverage of all indices
    (5) address variety
'''


def toBinary(num, length):
    toStr = bin(num)[2:]
    if (len(toStr) < length):
        leading_zeros = ""
        for i in range(len(toStr), length):
            leading_zeros += "0"
        toStr = leading_zeros + toStr
    return toStr

class RandAlgo:
    def __init__(self):
        
        self.name = ""
        self.addresses = []
        self.hit_miss_list = []
        self.index_bits = None
        self.num_rows = None
        self.num_refs = None
        self.cold_start_miss = 0
        self.conflict_miss = 0
        self.hit_miss_ratio = None
        self.indices_coverage = None
        self.address_variety = None
    
    def __str__(self):
        toString = ""
        toString += ("There are in total " + str(len(self.addresses)) + " addresses: \n")
        for i in range(len(self.addresses)):
            toString += (str(self.addresses[i]) + "\n")
        toString += ("Hit miss ratio " + str(self.hit_miss_list) + "\n")
        return toString
    
    def updateHitMissList_missType(self):
        self.conflict_miss = 0
        self.cold_start_miss = 0
        self.hit_miss_list = []
        
        curr_tagIndex_table = []
        for i in range(self.num_rows):
            curr_tagIndex_table.append([0, ""])
            
        for i in range(self.num_refs):
            valid_tagIndex_list = []
            for j in range(self.num_rows): # collect all current valid tagIndices
                if (curr_tagIndex_table[j][0] == 1):
                    valid_tagIndex_list.append(curr_tagIndex_table[j][1] + toBinary(j, self.index_bits))
            # print(curr_tagIndex_table)
            # print(valid_tagIndex_list)
            if (self.addresses[i][0] + self.addresses[i][1]) not in valid_tagIndex_list:
                self.hit_miss_list.append(False)
                curr_tagIndex_table[int(self.addresses[i][1],2)][1] = self.addresses[i][0]
                if (curr_tagIndex_table[int(self.addresses[i][1], 2)][0] == 1):
                    self.conflict_miss += 1
                else:
                    self.cold_start_miss += 1
                    curr_tagIndex_table[int(self.addresses[i][1], 2)][0] = 1
            else:
                self.hit_miss_list.append(True)
    
    def calculateHitMissRatio(self):
        hits = 0
        for i in self.hit_miss_list:
            if i: 
                hits += 1
        self.hit_miss_ratio = hits/self.num_refs
        # print("The hit miss ratio is " + str(self.hit_miss_ratio))
    
    def calculateIndicesCoverage(self):
        uniqueIndices = set()
        for address in self.addresses:
            if address[1] not in uniqueIndices:
                uniqueIndices.add(address[1])
        self.indices_coverage = len(uniqueIndices)/self.num_rows
        # print("The coverage of indices (uniqueIndices / numRows) is " + str(self.indices_coverage))
    
    def calculateAddressVariety(self):
        uniqueTagIndex = set()
        for address in self.addresses:
            if (address[0] + address[1]) not in uniqueTagIndex:
                uniqueTagIndex.add(address[0] + address[1])
        self.address_variety = len(uniqueTagIndex)/self.num_refs
        # print("The address variety ratio (uniqueTagIndex / numRefs) is " + str(self.address_variety))
    
    def calcAll(self):
        self.updateHitMissList_missType()
        self.calculateHitMissRatio()
        self.calculateAddressVariety()
        self.calculateIndicesCoverage()
    # TODO: calculate conflict and cold start miss (done in update hit miss list)

    # TODO: keep track of the number of times where adding an entries would overwrite the orignal content

    # def calReplaceRate(self): # small question: is this different from conflict miss?
    #     replacement_rate = 0
        
    #     print("The replacement rate is " + str(replacement_rate))