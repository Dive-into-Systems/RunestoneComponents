'''
cache behavoirs to keep track on potentially:
    (1) cold start miss
    (2) conflict miss: related to number of rows
    (3) miss / hit ratio
    (4) coverage of all indices
    (5) address variety
'''
index_all = ["00", "01", "10", "11"]


class RandAlgo:
    def __init__(self):
        self.addresses = []
        self.hit_miss_list = []
        self.num_rows = None
        self.num_refs = None
        self.cold_start_miss = None
        self.conflict_miss = None
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
    
    def updateHitMissList(self):
        if len(self.hit_miss_list) == len(self.addresses):
            return
        else:
            curr_tagIndex_table = []
            for i in range(self.num_rows):
                curr_tagIndex_table.append([0, ""])
                
            for i in range(len(self.addresses)):
                valid_tagIndex_list = []
                for j in range(4): # collect all current valid tagIndices
                    if (curr_tagIndex_table[j][0] == 1):
                        valid_tagIndex_list.append(curr_tagIndex_table[j][1] + index_all[j])
                if (self.addresses[i][0] + self.addresses[i][1]) not in valid_tagIndex_list:
                    self.hit_miss_list.append(False)
                    curr_tagIndex_table[index_all.index(self.addresses[i][1])] = self.addresses[i][0]
                else:
                    self.hit_miss_list.append(True)
        self.calculateHitMissRatio()
    
    def calculateHitMissRatio(self):
        hits = 0
        for i in self.hit_miss_list:
            if i: 
                hits += 1
        self.hit_miss_ratio = hits/self.num_refs
        print("The hit miss ratio is " + str(self.hit_miss_ratio))
    
    def calculateIndicesCoverage(self):
        uniqueIndices = set()
        for address in self.addresses:
            if address[1] not in uniqueIndices:
                uniqueIndices.add(address[1])
        self.indices_coverage = len(uniqueIndices)/self.num_rows
        print("The coverage of indices (uniqueIndices / numRows) is " + str(self.indices_coverage))
    
    def calculateAddressVariety(self):
        uniqueTagIndex = set()
        for address in self.addresses:
            if (address[0] + address[1]) not in uniqueTagIndex:
                uniqueTagIndex.add(address[0] + address[1])
        self.address_variety = len(uniqueTagIndex)/self.num_refs
        print("The address variety ratio (uniqueAddress / numRefs) is " + str(self.address_variety))