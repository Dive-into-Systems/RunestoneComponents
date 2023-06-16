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
the RandAlgo class keeps track of four dimensions of an address-generating algorithm:
1. miss type (conflict miss/non conflict miss)
2. hit/miss ratio
3. indices coverage (number of unique indices generated over all possible indices)
4. address variety (number of unique addresses over the size of one address list)
'''
class RandAlgo:
    def __init__(self):
        
        self.name = "" # name of algorithm
        self.addresses = [] # list of generated addresses in one run
        self.num_refs = None # length of the list of generated addresses in one run
        self.index_bits = None # number of bits for index
        self.num_rows = None # number of entries in cache structure
        self.hit_miss_list = [] # store hit/miss history

        self.cold_start_miss = 0
        self.conflict_miss = 0
        self.hit_miss_ratio = None
        self.indices_coverage = None
        self.address_variety = None
    
    # print out all info in current test run
    def __str__(self):
        toString = ""
        toString += ("There are in total " + str(len(self.addresses)) + " addresses: \n")
        for i in range(len(self.addresses)):
            toString += (str(self.addresses[i]) + "\n")
        toString += ("Hit miss ratio " + str(self.hit_miss_ratio) + "\n")
        toString += ("Address variety" + str(self.address_variety) + "\n")
        toString += ("Indices coverage" + str(self.indices_coverage) + "\n")
        return toString
    
    # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
    def updateHitMissList_missType(self):
        self.conflict_miss = 0
        self.cold_start_miss = 0
        self.hit_miss_list = []
        
        curr_tagIndex_table = [] # represent current cache status
        for i in range(self.num_rows): # init cache as empty
            curr_tagIndex_table.append([0, ""])
        
        # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
        for i in range(self.num_refs):
            valid_tagIndex_list = []
            for j in range(self.num_rows): # collect all current valid tagIndices
                if (curr_tagIndex_table[j][0] == 1):
                    valid_tagIndex_list.append(curr_tagIndex_table[j][1] + toBinary(j, self.index_bits))
            # if current tag_index combination is not valid, record it as a miss
            if (self.addresses[i][0] + self.addresses[i][1]) not in valid_tagIndex_list:
                self.hit_miss_list.append(False)
                curr_tagIndex_table[int(self.addresses[i][1],2)][1] = self.addresses[i][0]
                # if this tag_index combination index into a valid entry, record it as a conflict miss
                if (curr_tagIndex_table[int(self.addresses[i][1], 2)][0] == 1):
                    self.conflict_miss += 1
                # otherwise, record it as a cold start miss
                else:
                    self.cold_start_miss += 1
                    curr_tagIndex_table[int(self.addresses[i][1], 2)][0] = 1
            #otherwise, record it as a hit
            else:
                self.hit_miss_list.append(True)
    
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