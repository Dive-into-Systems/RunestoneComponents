import random
from collections import deque
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

def binary2decimal(str):
    ans = 0
    for i in str:
        ans = (ans*2 + int(i))
    return ans

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
    def __init__(self, name, occupancy, indexBits, numPages, numFrames, rangePages, startFrame, numRefs):
        
        self.name = name # name of algorithm
        self.addresses = None # list of generated addresses in one run
        self.num_refs = numRefs # length of the list of generated addresses in one run
        self.index_bits = indexBits # number of bits for index
        self.num_pages = numPages # number of entries in cache structure
        self.num_frames = numFrames
        
        self.hit_miss_list = [] # store hit/miss history

        self.pf_noEvict = None
        self.pf_evict = None
        self.hit_count = None
        self.indices_coverage = None
        self.address_variety = None
        
        self.range_pages = rangePages
        self.start_frame = startFrame
        self.occupancy = occupancy
        
        self.invalid = set()
        self.replacementStruct = deque()
        self.currentVmTable = []
        for i in range(self.num_pages):
            self.currentVmTable.append([0, -1])
    
    # print out all info in current test run
    def __str__(self):
        toString = ""
        toString += ("There are in total " + str(len(self.addresses)) + " addresses including " + str(self.occupancy) + " occupancies:\n")
        for i in range(len(self.addresses)):
            toString += (str(self.addresses[i]) + "\n")
        toString += ("Hit " + str(self.hit_count) + "\n")
        toString += ("Page Fault w/o evict " + str(self.pf_noEvict) + "\n")
        toString += ("Page Fault w/ evict " + str(self.pf_evict) + "\n")
        toString += ("Indices coverage " + str(self.indices_coverage) + "\n")
        return toString        
                

    # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
    def updateHitPageFaultList_missType(self):
        self.pf_noEvict = 0
        self.pf_evict = 0
        self.hit_count = 0
        self.invalid.clear()
        for i in range(self.range_pages):
            self.invalid.add(i + self.start_frame)
            
        count = 0
        for currPage, offset in self.addresses:
            currFrame, evictedPage, curr_hm, curr_evict = self.replacementFIFO(currPage)

            if (evictedPage != -1):
                self.currentVmTable[binary2decimal(evictedPage)][0] = 0
                self.currentVmTable[binary2decimal(evictedPage)][1] = -1
            self.currentVmTable[binary2decimal(currPage)][0] = 1
            self.currentVmTable[binary2decimal(currPage)][1] = currFrame
            
            if count < self.occupancy:
                count += 1
                continue

            self.hit_miss_list.append(curr_hm)
        
            if curr_hm:
                self.hit_count += 1
            elif curr_evict:
                self.pf_evict += 1
            else:
                self.pf_noEvict += 1

    
    def findPage(self, currPage):
        for i in range(len(self.replacementStruct)):
            if currPage == self.replacementStruct[i][1]:
                return i
        return -1
    
    def replacementFIFO(self, currPage):
        idx = self.findPage(currPage)
        if (idx == -1):
            if (len(self.replacementStruct) < self.num_frames):
                self.replacementStruct.append([len(self.replacementStruct), currPage])
                self.invalid.remove(binary2decimal(currPage))
                return [len(self.replacementStruct) - 1, -1, False, False]
            else:
                currFrame, evictedPage = self.replacementStruct.popleft()
                self.invalid.add(binary2decimal(evictedPage))
                self.invalid.remove(binary2decimal(currPage))
                self.replacementStruct.append([currFrame, currPage])
                return [currFrame, evictedPage, False, True]
        else:
            return [self.replacementStruct[idx][0], -1, True, False]

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
            uniqueIndices.add(address[0])
        self.indices_coverage = len(uniqueIndices)/self.range_pages
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
        self.address_variety = len(uniqueTagIndex)/self.range_pages
        # if self.address_variety > 1:
        #     print(uniqueTagIndex)
        #     print(self.addresses)
        #     raise Exception("address variety cannot be larger than 1")
        # print("The address variety ratio (uniqueTagIndex / numRefs) is " + str(self.address_variety))
    
    def calcAll(self):
        self.updateHitPageFaultList_missType()
        self.calculateIndicesCoverage()