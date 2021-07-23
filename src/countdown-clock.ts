export class CountdownClock {

    public initializeClock(element: Element, endtime: Date) {
        element.setAttribute('style', `
            background: linear-gradient(to right, rgb(12, 80, 255) 0%, rgb(12, 80, 255) 24%, rgb(91, 157, 255) 55.73%, rgb(255, 116, 241) 75%, rgb(255, 116, 241) 100%);
            border-radius: 32px;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            max-width: 180px;
            max-height: 32px;
            font-size: 13px;
            font-weight: 600;
            position: absolute;
            left: 8px;
            bottom: 105px;
            cursor: pointer;
        `)

        let borderElement = document.createElement('div')
        borderElement.setAttribute('style', `
            background: rgb(255, 255, 255);
            width: 100%;
            text-align: center; 
            border-radius: 32px; 
            padding: 8px 10px 8px 10px;
        `)
        element.appendChild(borderElement)

        let daysSpan = document.createElement('span');
        let hoursSpan = document.createElement('span');
        let minutesSpan = document.createElement('span');
        let secondsSpan = document.createElement('span');
        let fireIcon = document.createElement('span')
        fireIcon.innerHTML = `left <span style="background-image:url(https://cdn.jsdelivr.net/npm/emoji-datasource-apple@6.0.1/img/apple/64/1f525.png);display: inline-block;width: 1em;height: 1em;background-size: contain;margin: -2px 0px;"></span>`

        borderElement.appendChild(daysSpan)
        borderElement.appendChild(hoursSpan)
        borderElement.appendChild(minutesSpan)
        borderElement.appendChild(secondsSpan)
        borderElement.appendChild(fireIcon)

        function updateClock() {
            const t = getTimeRemaining(endtime);

            if (t.total <= 0) {
                element.setAttribute('style', `display: none;`)
                clearInterval(timeinterval);
            }
            else {
                if (t.days > 0) {
                    daysSpan.setAttribute('style', `margin-right: 5px;`)
                    daysSpan.innerHTML = `${t.days}d`;
                }
                if (t.hours > 0) {
                    hoursSpan.setAttribute('style', `margin-right: 5px;`)
                    hoursSpan.innerHTML = `${('0' + t.hours).slice(-2)}h`;
                }
                if (t.minutes > 0) {
                    minutesSpan.setAttribute('style', `margin-right: 5px;`)
                    minutesSpan.innerHTML = `${('0' + t.minutes).slice(-2)}m`;
                }

                secondsSpan.setAttribute('style', `margin-right: 5px;`)
                secondsSpan.innerHTML = `${('0' + t.seconds).slice(-2)}s`;
            }
        }

        function getTimeRemaining(endtime: Date) {
            const total = endtime.getTime() - new Date().getTime();
            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            return {
                total,
                days,
                hours,
                minutes,
                seconds
            };
        }

        updateClock();
        const timeinterval = setInterval(updateClock, 1000);
    }
}
