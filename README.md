This module contains utility functions and other shared functionality used in the Foundry VTT modules for Miska's Maps.

Current functions include a basic "ladder" function for regions and a teleporter dialog to move tokens between regions.
The teleporter feature is still rough around the edges, and I'll improve it when I have the time.
NOTE: Teleporters use the first shape to get the relative position of the token in the region, meaning they work best with only one shape and if all regions have the same shapes. Later position validation and different shaped teleporters will be supported

In the future, a variant picker will likely be developed to more easily change between different variants of maps.
