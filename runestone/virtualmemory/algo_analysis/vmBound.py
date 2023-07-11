import random
from vmAlgoStats import generateBinaryStr
from vmAlgoStats import toBinary
from vmAlgoStats import vmAlgo

def generateIndex(indexBits, lb, ub):
    return toBinary(random.randint(lb,ub), indexBits)

def generateOffset(offsetBits):
    return generateBinaryStr(offsetBits)

def setOccupancy(occupancy, indexBits, offsetBits, lb, ub, addresses):
    occupy = set()
    while len(occupy) < occupancy:
        occupy.add(generateIndex(indexBits, lb, ub))
    occupy = list(occupy)
    for i in range(len(occupy)):
        occupy[i] = (occupy[i], generateOffset(offsetBits))
    addresses.extend(occupy)
    

def generateRef(indexBits, offsetBits, numRefs, lb, ub, addresses):
    for i in range(numRefs):
        addresses.append((generateIndex(indexBits, lb, ub), generateOffset(offsetBits)))

def main_vm_bound(indexBits, offsetBits, numRefs, numFrames=4, rangePages = 5, occupancy = 0):
    numPages = 1 << indexBits
    lb = random.randint(0, numPages - rangePages)
    ub = lb + rangePages - 1
    
    vmBound = vmAlgo("vmBound", occupancy, indexBits, numPages, numFrames, rangePages, lb, numRefs)
    addresses = []
    setOccupancy(occupancy, indexBits, offsetBits, lb, ub, addresses)
    generateRef(indexBits, offsetBits, numRefs, lb, ub, addresses)
    vmBound.addresses = addresses
    
    vmBound.calcAll()
    
    return vmBound

if __name__ == '__main__':
    vmBound = main_vm_bound(4, 4, 8, 4, 8, 2)
    print(vmBound)