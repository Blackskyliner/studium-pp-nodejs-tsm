#!/bin/bash

######################################################################################
# This start script provides an easy way to spawn multiple worker at once.           #
# It saves the worker logs by hostname. Therefore you will only need to install      #
# the script once and then share it through SMB, NFS or whatever network FS you got. #
######################################################################################

# We want at least as many worker as we got processor cores
NUMWORKER=$(cat /proc/cpuinfo | grep processor | wc -l)

# Goto our working dir
cd ..

# Spawn the worker
for((i=1; i<=$NUMWORKER; i++))
do
    echo "Spawn worker $i on: "$(hostname)
    make worker > logs/$(hostname)_$i.log 2> logs/$(hostname)_$i.err &
done
