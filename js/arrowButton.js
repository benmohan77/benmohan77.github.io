(function() {
    var ArrowButton = function(direction) {
        var arrowButton = new createjs.Shape();
        arrowButton.graphics.beginStroke("#000000").beginFill("#000000").drawPolyStar(15, 15, 15, 3, .5, 180);
        arrowButton.rotation = direction;
        arrowButton.on("mouseover", changeColor);
        arrowButton.on("mouseout", changeColor);
        arrowButton.regY = 15;
        arrowButton.regX = 0;
        return arrowButton;
    }

    function changeColor(event) {
        event.target.alpha = (event.type == "mouseover") ? 0.75 : 1;
    }

    window.ArrowButton = ArrowButton;
}());