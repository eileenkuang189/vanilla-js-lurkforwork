Perceivability:
- All website images which add meaning and aren't just decorative have alternative text if the image does not load.
    - Non-useful images do not have an alt text.
- Text on website is clearly distinguishable, with majority black text on white background, or white text on blue background.
- Since bootstrap icons with <i></i> tag does not have the alt tag attribute, we used "aria-label" for our interactive like and comment elements
- Button theme is navy blue and white; heavily contrasting colours 

Understandability:
- Forms are labelled with the purpose of the form. Form inputs are labelled.
- Spinning circle status for when we are loading more jobs, to make sure that users do not think the website is unresponsive. This also the user to better understand the system progress and improve our system feedback.
- Content is labelled in English.
- The layout of our website is familiar and consistent. It is easy to navigate, since it only involves the User scrolling downwards to go through the feed and profile. All sections are labelled clearly.
- Information within jobs are sectioned off clearly to make for easy understanding & the breakup of large chunks of text.
- Alerts and error messages are succinct and specific to help user quickly understand the error.
- Dates are displayed in the form DD/MM/YYYY, instead of UTC time, for ease of understanding

Operability:
- All buttons that can be pressed uses the <button\> tag. This allows the user to use tab to go through selections, hence supporting keyboard interaction.
- Nav bar is within the <header\> tag and the footer is within the <footer\> tag. All different screens are separated into <section\>.
- No blinding/flashing lights that might cause seizures.
- Error messages pop up via alert messages when users encounter errors or problems on the website.
- ARIA attributes are included in our forms & input sections.

Robustness:
- Website UI provides clear navigation in the header and is optimised for mobile usage
- Concise language is used in alerts, error and confirmation messages
- Website is accessible for all users

Visibility 
- Buttons on the header navigation bar is prioritised over burger menu, to enhance recognition rather than recall 

Affordance 
- We added tooltips on hover for less inituitive icons, i.e. icons without supplemented text. This is seen in the navigation header bar, as well as on the My Profile page for edit and delete icons.
- Like and comment buttons invert colour on hover

Consistency
- Consistent colour scheme (blue, white, grey)
- Buttons follow a consistent primary and secondary theme 

Constraints 
- Constraints are implemented through popup error handling on forms for invalid or empty inputs