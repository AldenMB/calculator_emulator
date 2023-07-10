# calculator_emulator
A Javascript simulacrum of a TI-30Xa.

[See the calculator in action!](https://aldenmb.github.io/calculator_emulator/)

# About

This page is dedicated to my favorite handheld calculator, the TI-30Xa. I made it to serve several purposes:
 - To practice my test-driven development. A suite of tests have already run by the time your browser loads the page. These allow me to refactor my code with confidence and debug quickly.
 - To see if I really understand how my calculator works. I have already learned a few things, such as the limited order-of-operations the 30Xa has. Also, this may seem obvious, but I also realized for the first time that the display segments are at a five degree angle. Here is another intersting fact: if there are no open parentheses, the close-parenthesis button does the same thing as the equals key. Another amusing fact: while promotional materials display the more common 3-segment "7", the calculator itself shows the less-common 4-segment version.
 - So I can demonstrate using this calculator in class without the glare which comes from using the document camera, and students can follow along on their smartphones if they left their calculator at home. In particular, this could fill a similar role to TI-SmartView, which as of right now is not available for the 30Xa.

# Copyright

All this code is my original creation, with the exception of the Decimal module. None of the code is copied from any previously existing calculator, and I don't believe it is currently protected by any patents either. It is available to you under the GPL-3.0 licence, a copy of which is included in this repository. I also welcome any contributions. If you are using this and you require a more permissive licence then I may be willing to make an exception on a case-by-case basis.

Of course, `Texas Instruments` and their logo are trademarks of Texas instruments Incorporated. The image of the calculator is their copyrighted promotional picture. It is being used here to ensure a uniform experience for students who have the physical calculator and are also using the emulator. I don't imagine TI would have any problem with that. If any representative of Texas Instruments is reading this and would like me to remove any TI copyrighted materials, do get in touch.

# issues
This project is far from done! additional tasks include:

## explain bugs

 - The real calculator seems to have a bug where, if parentheses are opened twice then closed once, the parenthesis indicator does not engage. You can see this by typing `4 + ( ( ) COS`, followed by variously `=` or `)`. If you press `)`, then the screen shows 1 as it has closed the second parenthesis. On the other hand, if you press `=`, it shows 5 as it evaluates the whole expression. However, immediately following the first `)`, the screen no longer shows the parentehsis indicator. Why is this? What could be happening? Without a model for the behavior, it is unclear how I can implement it. It seems that the real behavior of the calculator actually does keep both parentheses, even though one is omitted from the display.

## making it pretty

 - Display the history pretty, using images of the keys.
 - Make the keys react visually when pressed.

## making it functional - implement these:

 - alternate display modes
 - constant key
 - statistical register
 - polar/cartesian conversion, and angle formats

## guaranteeing reliability

 - Since this is an emulator, we can in principle test any input against the real calculator to see what it should do. It would be impractical to test every possible input, since there are 40-to-the-n button press sequences of length n. However, since most of those sequences never occur, it should be feasible to test every (or nearly every) sequence of button presses which are done on the website. This would just require collecting some usage statistics. 
 
 This is the idea at the heart of [Xanthippe](https://aldenbradford.com/introducing-xanthippe.html). Once your calculator session has ended, the sequence of buttons you pressed will be sent to a small computer sitting in my living room which pushes those same buttons on a real TI-30Xa calculator.

## new features

 - add a mode to show my proposal for the perfect pocket calculator. It should be almost identical, but it should do away with the polar subsystem and use the three freed-up buttons to add some conspicuously-missing functions: modulus, normal CDF, and inverse normal CDF. There is an open spot already on the 2nd function of the +/- key, so we can even have one more function for free. Why not a uniform random number generator? Also, it should allow fractions in more contexts -- I should be able to square or reciprocal a fraction without it being converted to a decimal.
