(function() {
    var Button = function(input) {
        var button = new createjs.Container();
        var text = new createjs.Text(input, "28px Arial", "#000000");
        var shape = new createjs.Shape();
        shape.graphics.beginStroke("#000000").beginFill("#409323").drawRect(0, 0, 100, 40);
        text.x = 20;
        text.y = 7;
        button.addChild(shape, text);
        button.mouseChildren = false;
        button.on("mouseover", changeColor);
        button.on("mouseout", changeColor);
        return button;
    }

    function changeColor(event) {
        event.target.alpha = (event.type == "mouseover") ? 0.75 : 1;
    }

    window.Button = Button;
}());