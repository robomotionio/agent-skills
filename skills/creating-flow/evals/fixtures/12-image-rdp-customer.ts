import { flow, Custom, Message } from '@robomotion/sdk';


// ── image templates (robomotion-image-mcp): consts the Image Automation nodes use as `image` ──
// 144x50: the password field (unlabelled)
const IMG_PASSWORD_FIELD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAyCAIAAAA88MUKAAABjUlEQVR4Ae3BMREDQAgEwMPCV2hBAFq+wksU3TXREhsxAcXPsGsehUk3jySSWB3MozDp5pFEEquDeRQm3TySSGJ1MI/CpN/3g9XHPArrHeZRWO8wj8J6h3kU1jvMo7DeYR6F9Q7zKKx3mEdhvcM8CpNuHqw+5lGYdPNIwmpiHoVJN48kklgdzKMw6eaRRBKrg3kUJt08kkhidTCPwqSbRxJJrA7mUZh080giidXBPAqTbh5JJLE6mEdh0s0jiSRWB/MoTLp5JJHE6mAehUk3jySSWB3MozDp5pFEEquDeRQm3TySSGJ1MI/CpJtHEkmsDuZRmHTzSCKJ1cE8CpNuHkkksTqYR2HSzSOJJFYH8yhMunkkkcTqYB6FSTePJJJYHcyjMOnmkUQSq4N5FCbdPJJIYnUwj8Kkm0cSSawO5lGYdPNIIonVwTwKk37fD1Yf8yisd5hHYb3DPArrHeZRWO8wj8J6h3kU1jvMo7DeYR6F9Q7zKKx3mEdhvcM8Cusd5lFY7zCPwnqHeRTWO/43E6ulHH1MhgAAAABJRU5ErkJggg==';
// 51x12: Click Acme ERP
const IMG_CLICK_ACME_ERP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAMCAIAAABA7xIFAAABcklEQVQ4Ec3BwYkkURBDwVdutTxJI0q2pBElT+TXwoeCHtjjHCbi+twPf9L1uR/+pOtzP7y6A8jhl3SHL3K6w0sOR3d4yeG4PvfDqzuAHH5Jd+TwpTtyOLojB+iOHI7uyAGuz/1wdEcO0B05HN3hkNMdDjndAeRwdIdDDl+6I4cv3ZHD0R05QHfkcHRHDnB97oejO3KA7sgBuiOHV3fkAN2RA3RHTnfkcHRHDq/u8JIDdEcOR3fkAN2Rw9EdOcD1uR+O7sgBuiMH6I4cXt2RA3RHDtAdOd3hixxe3ZHDl+7wksPRHV5yOK7P/QDd4Sc53ZHDqztygO7IAbojpzty+J/uyOFLd+QA3ZHD0R05/HR97gfojhxe3ZHTHTm8uiMH6I4coDtyuiOHoztyeHVHDl+6I4ejO3KA7sjhp+tzP0B35PDqjhygOxxyuiMH6I4coDtygO5wyOFLd/gipztyeHVHTnfk8NP1uR/+pOtzP/xJ/wA/F/apvSEfLQAAAABJRU5ErkJggg==';
// 172x26: Field Name:
const IMG_FIELD_NAME = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKwAAAAaCAIAAAClwCDnAAAB8UlEQVRoBe3Bsa3YSgxFwbP1mMBnZhatQOFmZHhDBizIgAADVgnvr2bWtPicbU2Lz9nWtPicbU2Lz9t1b06ypsXn7bp3VXGMNS0+b9e9qyozOcOaFp+3695VlZmcYU2Lz9t176rKTM6wpsXn7bp3VWUmZ1jTAswDmBYP85gWp7ruXVWZyRnWtADzAKbFwzymxamue1dVZnKGNS3APKZlHtMCzGNagHnwmBZgHjymZR7AtHiYB49p8TCPafEDXfeuqszkDGtagHlMyzymBZjHtPiHeUzLPKYFmMe0APOYlnlMi4d5TAswj2nxA133rqrM5AxrWoB5TAswj2mZx7QA8+CvaZnHtADzmBZgHtMyD/4xLX6y695VlZmcYU0LMI9pAeYxLfOYlnlMi4d5TMs8pgWYx7QA85iWeUyL/4vr3lWVmZxhTQswj2nxMA9gWuYxLR7mMS3zmBZgHtMCzGNa5jEtHuYxLcA8psUPdN27qjKTM6xpAeYxLR7mAUwLMA/+mpZ5TAswj2kB5jEtwDx4TIuHeUyLH+i6d1VlJmdY0+Lzdt27qjKTM6xp8Xm77l1VmckZ1rT4vF33rqrM5AxrWnzerntXVWZyhjUtPm/XvasqMznDmhaft+veVZWZnGFNi8/br/9+c5I1LT5nW9Pic7Y/J0BnTc4EPI0AAAAASUVORK5CYII=';
// 172x26: Field Email:
const IMG_FIELD_EMAIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKwAAAAaCAIAAAClwCDnAAAB5klEQVRoBe3BMYo2RwwE0OrzWGBl1qE7mHAyKaywgjrQDwsL32QGO9nteW9ZxOtsyyJeZ1sW8TrbsojX075unGRZxOtpX/fM4BjLIl5P+7pnprtxhmURr6d93TPT3TjDsojX077umelunGFZxP8hsiziV9jXPTPdjTMsiwAiCx8s4l+LLIuRZRG/wr7umelunGFZBBBZFvEfRJZF/Ar7umemu3GGZRFAZFnEh8jCF4uRBcAivkQWvlgEEFkWI8sigMiyiJ9sX/fMdDfOsCwCiCx8swggsiwCiCyLACLLIj5ElsXIshhZFgFElkX8ZPu6Z6a7cYZlEUBkWcSHyLIIILIsAogsiwAiC98sRpbFyLKIX2Ff98x0N86wLAKILIv4EFkWAUSWRQCRZTGyLOJLZFmMLIuRZRG/wr7umelunGFZBBBZFvEhsiwCiCyLACLLYmRZxJfIshhZFiPLIoDIsoifbF/3zHQ3zrAsAogsfLAYWRYBRJZFAJFlEUBk4ZvFyLIYWRYBRJZF/GT7umemu3GGZRGvp33dM9PdOMOyiNfTvu6Z6W6cYVnE62lf98x0N86wLOL1tK97ZrobZ1gW8Xra1z0z3Y0zLIt4Pe3rnpnuxhmWRbye/vr7H5xkWcTrbMsiXmf7A7rgW00JSTjAAAAAAElFTkSuQmCC';
// 172x26: Click Country:
const IMG_CLICK_COUNTRY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKwAAAAaCAIAAAClwCDnAAACLElEQVRoBe3BMarlVhAE0LrrcYM7cy9agUJl3WGFFdSCBi48+MKZDcMbpHOWRbyebVnE69mWRbyebVnE6+44LzzJsojX3XFeM4PHWBbxujvOa2a6G8+wLOJ1d5zXzHQ3nmFZxOvuOK+Z6W48w7KI191xXjPT3XiGZREfkYUPi/hPIssi/mTHec1Md+MZlkVskWUR/1tkWcSf7DivmeluPMOyCCCyLOJfIgubRQCRZRFbZFmMLHxYBBBZ2CxGlsXIshhZFrFFlkUAkWURX+Y4r5npbjzDsgggsiziLrIsYossi5FlEVtkWYwsi9giy2JkWcQWWQAsAogsi9giyyKAyLKIL3Oc18x0N55hWQQQWRZxF1kWsUWWxciyiC2yLEaWRWyRZTGyLGKLLIv4iCyLkWURX+w4r5npbjzDsgggsiziLrIsYossi5FlEVtkWYwsi9giy2JkWcQWWRbxEVkWI8sivthxXjPT3XiGZRFbZFnED5FlEVtkWYwsi9giy2JkWcQWWRYjyyK2yLKIHyLLIj4iyyK+zHFeM9PdeIZlER+RhQ+LACILm0VskYUPi5FlEVtkWQQQWQAsRpZF/BBZFvERWRbxZY7zmpnuxjMsi/hdIssivt5xXjPT3XiGZRG/S2RZxNc7zmtmuhvPsCzidXec18x0N55hWcTr7jivmeluPMOyiNfdcV4z0914hmURr7vjvGamu/EMyyJed3/9/Q+eZFnE69mWRbye7RcdY5FNwRFyxQAAAABJRU5ErkJggg==';
// 46x14: Click Germany
const IMG_CLICK_GERMANY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAOCAIAAADfd7lWAAAA2klEQVQ4Ec3BQQobQBAEsa7/P1qBgQWH3GNLYb8h7DeEPdUe7P8KOxX2PWFbhf2j2sG2ChWqHVTbsFPtYFu1B9sq7FTYFrZV2N8q7FSotmFbhW0VtlXYhwoVdipU2KmwLWyrsK3aQbUPqLBTYVuFbRW2VXtQYafCtgoVdsK2CnsqVNiHCjsVtlXYVqHCToUKOxW2VaiwE3Yq7FSosFOhwk6FbRW2VaiwU6HCToWdCnvCnmoPtlU72FZhp8K2CtsqbKv2oMJOhZ0Ke8K+ocI+hH1DhX0I+w1hv+EP63wH9G7hGX0AAAAASUVORK5CYII=';
// 94x30: Click save
const IMG_CLICK_SAVE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF4AAAAeCAIAAAAq6D5VAAADmklEQVRoBe3BsWrrSBQG4H/ewbXTGjSgqaRpUlzQA/hBLmYhKrZNp0IBYfQYKqZUoeJAmiNVR3AEbuPaD7EwEEi4DveClt2A/X1GhXF3jVFh3F1jVBh31xgVRpSkOe6iHz9+tE1lVBhRkubLPOLmdaEnorapjAojStJ8mUfcvC70RNQ2lVFhREmaL/OIm9eFnojapjIqjChJ82UecfO60BNR21RGhRElab7MI25eF3oiapvKqDCiJM2XecRqWVHiz0xDje+nCz0RtU1lVBhRkubLPGK1rCg3uz2At9cnXPPw+ALgcgrTUOP76UJPRG1TGRVGlKT5Mo9YLSvKzW4P4O31Cdc8PL4AuJzCNNT4frrQE1HbVEaFESVpvswjVsuKcrPbA3h7fcI1D48vAC6nMA01fmGdxzsVxn+uCz0RtU1lVBhRkubLPGK1rCg3uz2At9cnXPPw+ALgcgrTUOMz67wK43/VhZ6I2qYyKowoSfNlHrFaVpSb3R7A2+sTrnl4fAFwOYVpqPGZdV6F8Zl1HpEKA7DOqzAi67wKA7DOI1JhrNOFnojapjIqjChJ82UesVpWlJvdHr9zOYVpqPEL6zwiFcZn1nkVts6rMCLrvApb51UYkXVehbFCF3oiapvKqDCiJM2XecRqWVFudnv8zuUUpqHG16zzKgzAOo93KgzAOq/C1nkVBmCdxwcqjBW60BNR21RGhRElab7MI1bLinKz2wOoD1tcUx7PAC6nMA01vmadV2HrvAojss6rMADrvApb51UYgHVehfEv6UJPRG1TGRVGlKT5Mo9YLSvKzW4PoD5s8UF5PAOoD9vyeAZwOYVpqPE167wKW+dVGJF1XoURWedVGJF1XoURWedVGCt0oSeitqmMCiNK0nyZR6yWFeVmtwdQH7b4oDyeAdSHbXk8A7icwjTU+Mw6j3cqjMg6j3cqjMg6r8J4Z51HpMJYpws9EbVNZVQYUZLmyzxitawoN7s9gPqwxQfl8QygPmzL4xnA5RSmocb304WeiNqmMiqMKEnzZR6xWlaUm90eQH3Y4pryeAZwOYVpqPH9dKEnorapjAojStJ8mUeslhUl/sw01Ph+utATUdtURoURJWm+zCNuXhd6ImqbyqgwoiTNl3nEzetCT0RtUxkVRpSk+TKPuHld6ImobSqjwoiSNF/mETevCz0RtU1lVBhRkubPz8+4A4iobSqjwoh+/vU37t61TWVUGHfX/ANXYP7WO97hhQAAAABJRU5ErkJggg==';
// 80x28: Click OK
const IMG_CLICK_OK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAcCAIAAAB56a/tAAADOklEQVRYCeXBIbKkWhAE0GQ/JUqWnf0gkNhxSATLaIFsd69MXBKR7OdHXDUL6Cd+v3Mmi/hNJov4TSaL+E0mixjmZcVXO/YNwGQRw7ysrTV8oz9//gA49g3AZBHDvKyttee+8F1e57v3DuDYNwCTRQzzsrbWnvvCd3md7947gGPfAEwWMczL2lp77gvf5XW+e+8Ajn0DMFnEMC9ra+25LwyRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZRHA63z33gEc+wZgsohhXtbW2nNf+C6v8917B3DsG4DJIoZ5WVtrz31hiCyL+KjIwmARQ2RZxBBZFvEhkWURwOt8994BHPsGYLKIYV7W1tpzX/gZkWURQ2RZBBBZFgFElkX8gNf57r0DOPYNwGQRw7ysrbXnvjBElkV8SGRZxD8iy2JkWYwsi/ioyLII4HW+e+8Ajn0DMFnEMC9ra+25L/yAyLKIf0SWxcgCYBE/5nW+e+8Ajn0DMFnEMC9ra+25LwyRZREfElkW8Y/IshhZACzi0yLLIoDX+e69Azj2DcBkEcO8rK21577wAyLLIv4RWRYjy2JkWcTPeJ3v3juAY98ATBYxzMvaWnvuC0NkWcTnRJZFDJFlEUBkWQQQWRbxOZFlEcDrfPfeARz7BmCyiGFe1tbac1/4MZGFwSKGyLKIIbIs4tNe57v3DuDYNwCTRQzzsrbWnvvCEFkW8b8VWRYBvM537x3AsW8AJosY5mVtrT33he/yOt+9dwDHvgGYLGKYl7W19twXhsiyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyGFkWI8tiZFmMLIuRZTGyLEaWxciyCOB1vnvvAI59AzBZxDAva2vtuS98l9f57r0DOPYNwGQRw7ysrbXnvvBdXue79w7g2DcAk0UM87K21v7+/Yuv03sHcOwbgMkihnlZ8dWOfQMwWcQwLyu+2rFvACaL+E0mi/hN/gOaXWwLFKLDrgAAAABJRU5ErkJggg==';
// 449x15: Read Customer 10001 saved.
const IMG_READ_CUSTOMER_10001_SAVED = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcEAAAAPCAIAAAATTOPPAAAEeUlEQVR4Ae3BwYljaxoDUDme+sDaWSF46YXzeS8gL7x0CPJOBjmfgR8uVNE9DPOYYormnnP4+++/sdvtdn+iv/766/163u4PfJtDY+x2u92f6ON4er+et/vjejnjexwaY7fb7f5EH8fT+/W83R/Xyxnf49AYu/+doRpjt9v9AB/H0/v1vN0f18sZ3+PQGJ8MhU1j/CdDNcZ3GqoxNkNhaYxlKCyNsQyFpTE2QzXGNxuqMXa73Q/wcTy9X8/b/XG9nLEZqjE2QzXGP3VojM1QjfHfGKoxvs1QABpjGaoxlqEaD9UYy1CNh2qMZajGAIYC0BjfbKjG2O12P8DH8fR+PW/3x/VyxmaoxtgM1Rj/1KExlqEa46uhGmMZqjGAobA0HgpLYwBDYWkMYCgsjYcC0BjLUFgaAxiq8VCN8dVQjbEM1RjLUI2HaoxlqMZDNcYyVGMsQzXGL4bC0hjAUFgaAxiqMZahGgMYCktjLENh0xi73e4H+Die3q/n7f64Xs7YDNUYm6EaAxgKS2MAQ2FpDGCoxkM1BjBUYwCHxliGaoyvhmqMZajGQzXGZqjGWIZqjGWoxkM1BjBUYwBDNR6qMZahGg8FoDF+MVRjLEM1xjJU46EaYxmq8VCNsQzVGMtQjfHVUI3xO0M1HqoxlqEaD9UYy1CNh2qMZajG2O12P8DH8fR+PW/3x/VyxmaoxtgM1XioxtgM1RjLUI2HAtAYy1CNARwaYxmqMb4aqjGWoRoPBaAxlqEaYxmqMZahGg/VGMBQjQEM1XgofNJ4qMb4naEaYxmqMZahGg/VGMtQjYdqjGWoxliGaoyvhgLQGJuhsGkMYKjGQzUGMBQ+aTxUYyxDNcZut/sBPo6n9+t5uz+ulzM2QzXGZqjGQwFojGUofNJ4qMb4xaExlqEa46uhGmMZqjGWoQA0HqoxlqEaYxmq8VCNAQzVGMBQjYdqjE+GaozfGaoxlqEaYxmq8VCNsQzVeKjGWIZqjGWoxvidoQA0HqoxlqEaAxiq8VCNAQzVGJ8M1RjLUI2x2+1+gI/j6f163u6P6+WMzVCNsRmqMZahADQeqjE+GaoxfnFojM1QjfHJUI2xDNUYm6EaD9UYy1CNsQzVeKjGAIZqDGCoxkM1xjJU46Ea43eGaoxlqMZYhmo8VGMsQzUeqjGWoRpjGaox/o2hGg/VGMtQjbEM1RjLUI2xDNV4qMZYhmoMYKjG2O12/z8fx9P79bzdH9fLGZuhGmMzVGNshmo8VGMsQzUeqjE2QzUGcGiMT4bCpjGAobBpPBSWxliGAtAYwFBYGgMYqjGAoRoDGKoxgKGwNAYwVGP8YigsjbEMhaUxlqGwNMYyFJbGWIbC0hifDIWlMZahsGmMZajG2AyFpTGWobBpDGCoxtjtdv8/H8fT+/W83R/XyxmfDIVNYwBDYWmMZSgsjQEM1RiboRoDODTGbrfb/Yk+jqf363m7P66XM77HoTF2u93uT/RxPL1fz9v9cb2c8T0OjbHb7XZ/oo/j6f163u6P6+WM7/EvEGARpcR4l2IAAAAASUVORK5CYII=';
// ── end of image templates ──
// Save a customer (ERP over RDP)

// Eval fixture: the robot-tested flow recorded by robomotion-image-mcp, without
// Focus Window (a 0.12.0 node the published pspec does not list yet).
// Save a customer in Acme ERP, which runs on a Remote Desktop session the robot
// can only see as pixels. Recorded with robomotion-image-mcp (exploring-image):
// every template was verified unique on the screen and replayed through the
// Image Automation nodes.
flow.create('a1f012', 'Save a customer (ERP over RDP)', (f) => {
  f.addDependency('Robomotion.ImageAutomation', '0.11.4');

  f.node('5e0a11', 'Core.Trigger.Inject', 'Start', {})
    .then('7c21d4', 'Core.Process.StartProcess', 'Start the Remote Desktop session', {
      inFilePath: Custom('C:/Users/faik/go/src/robomotion/robomotion-image-mcp/testapp/AcmeRemote/bin/Release/net8.0-windows/AcmeRemote.exe'),
      inCustomArgs: ['--screen', 'login', '--log', 'C:/Users/faik/AppData/Local/Temp/acme-robot-events.jsonl', '--pos', '300,87'],
      optBackground: true,
    })
    // The test bench's sign-in; a real session's password comes from a Vault credential.
    .then('b8e2c7', 'Robomotion.ImageAutomation.Image.ClickType', 'Type the password', {
      image: IMG_PASSWORD_FIELD, deltaX: 58, deltaY: 25,
      inText: Custom('Winter2026!'),
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'), optClear: true,
    })
    .then('1d9e33', 'Robomotion.ImageAutomation.Keyboard.SendHotkey', 'Sign in', {
      inKeys: Custom('enter'),
    })
    .then('f06b2a', 'Robomotion.ImageAutomation.Image.ClickImage', 'Open Acme ERP', {
      image: IMG_CLICK_ACME_ERP, deltaX: 25, deltaY: 6,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'), optClickType: 'double',
    })
    .then('c4a871', 'Robomotion.ImageAutomation.Image.ClickType', 'Type the customer name', {
      image: IMG_FIELD_NAME, deltaX: 116, deltaY: 13,
      inText: Custom('Grace Hopper'),
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'), optClear: true,
    })
    .then('2e7f5b', 'Robomotion.ImageAutomation.Image.ClickType', 'Type the email', {
      image: IMG_FIELD_EMAIL, deltaX: 116, deltaY: 13,
      inText: Custom('grace@navy.example'),
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'), optClear: true,
    })
    .then('93cd06', 'Robomotion.ImageAutomation.Image.ClickImage', 'Open the Country list', {
      image: IMG_CLICK_COUNTRY, deltaX: 116, deltaY: 13,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('6b1a48', 'Robomotion.ImageAutomation.Image.ClickImage', 'Choose Germany', {
      image: IMG_CLICK_GERMANY, deltaX: 23, deltaY: 7,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('d5e2f1', 'Robomotion.ImageAutomation.Image.ClickImage', 'Save the customer', {
      image: IMG_CLICK_SAVE, deltaX: 47, deltaY: 15,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('e8c3b9', 'Robomotion.ImageAutomation.Image.ClickImage', 'Close the saved message', {
      image: IMG_CLICK_OK, deltaX: 40, deltaY: 14,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('4fa6d0', 'Robomotion.ImageAutomation.OCR.GetTextNearImage', 'Read the status bar', {
      image: IMG_READ_CUSTOMER_10001_SAVED,
      regions: [
        { x: 93.7639, y: 13.3333, width: 6.2361, height: 80 },
        { x: 0, y: 0, width: 26.5033, height: 100 },
      ],
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
      outText: Message('status'),
    })
    .then('0c7d9e', 'Core.Flow.Stop', 'Stop', {});
}).start();
