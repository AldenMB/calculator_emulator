# calculator_emulator
A Javascript simulacrum of a TI-30Xa.

[See the calculator in action!](https://aldenmb.github.io/calculator_emulator/)

# About

This page is dedicated to my favorite handheld calculator, the TI-30Xa. I made it to serve several purposes:
 -  To practice my test-driven development. A suite of tests have already run by the time your browser loads the page. These allow me to refactor my code with confidence and debug quickly.
 -  To see if I really understand how my calculator works. I have already learned a few things, such as the limited order-of-operations the 30Xa has. Also, this may seem obvious, but I also realized for the first time that the display segments are at a five degree angle. Here is another intersting fact: if there are no open parentheses, the close-parenthesis button does the same thing as the equals key. Another amusing fact: while promotional materials display the more common 3-segment "7", the calculator itself shows the less-common 4-segment version.
 - So I can demonstrate using this calculator in class without the glare which comes from using the document camera, and students can follow along on their smartphones if they left their calculator at home. In particular, this could fill a similar role to TI-SmartView, which as of right now is not available for the 30Xa.
</ul>

# issues
This project is far from done! additional tasks include:

## making it pretty

 - Display the history pretty, using images of the keys.
 - Make the keys react visually when pressed.
 - Get the favicon to display correctly.

## making it functional - implement these:

 - alternate display modes
 - constant key
 - statistical register
 - memory
 - polar/cartesian conversion, and angle formats
 - fractions

## new features

 - use the same base-10 floating point representation which the calculator uses, so it behaves exactly identical even in later decimal places.
 - add a mode to show my proposal for the perfect pocket calculator. It should be almost identical, but it should do away with the polar subsystem and use the three freed-up buttons to add some conspicuously-missing functions: modulus, normal CDF, and inverse normal CDF. Also, it should allow fractions in more contexts -- I should be able to square or reciprocal a fraction without it being converted to a decimal.
